import * as XLSX from 'xlsx';
import { storageGetBuffer } from '../storage';

// Tipos para os dados processados
export interface VariationData {
  itemId: string;
  variationId: string;
  variationName: string;
  unitsSold: number;
  salesBRL: number;
  conversionRate: number;
  consumo30Days: number;
  consumoDailyAvg: number;
}

export interface AnnouncementData {
  itemId: string;
  productName: string;
  totalUnitsSold: number;
  variations: VariationData[];
}

export interface ProcessedData {
  startDate: string;
  endDate: string;
  announcements: AnnouncementData[];
  topAnnouncements: AnnouncementData[];
}

// Função para limpar e converter valores numéricos
function cleanNumericValue(value: any): number {
  if (value === null || value === undefined || value === '-') {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    // Remove caracteres especiais e converte
    const cleaned = value
      .replace(/[^\d,.-]/g, '') // Remove tudo exceto dígitos, vírgula, ponto e hífen
      .replace(/\./g, '') // Remove separador de milhar (ponto)
      .replace(/,/g, '.'); // Substitui vírgula decimal por ponto

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  return 0;
}

// Função para processar o arquivo Excel
export async function processExcelFile(
  filePath: string,
  startDate?: string,
  endDate?: string
): Promise<ProcessedData> {
  try {
    // Ler o arquivo Excel do S3
    const fileBuffer = await storageGetBuffer(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    // Agrupar dados por ID do Item (Anúncio)
    const announcementMap = new Map<string, AnnouncementData>();

    for (const row of data) {
      const itemId = String(row['ID do Item'] || '');
      const variationId = String(row['ID da Variação'] || '');

      // Pular linhas que não são variações (linhas de resumo do item)
      if (!variationId || variationId === '-') {
        continue;
      }

      const productName = String(row['Produto'] || 'Unknown');
      const variationName = String(row['Nome da Variação'] || 'Unknown');
      const unitsSold = cleanNumericValue(row['Unidades (Pedido pago)'] as any);
      const salesBRL = cleanNumericValue(row['Vendas (Pedido pago) (BRL)'] as any);
      const conversionRate = cleanNumericValue(row['Taxa de conversão (Pedido pago)'] as any);

      // Calcular consumo (30 dias e diário)
      const consumo30Days = unitsSold;
      const consumoDailyAvg = consumo30Days / 30;

      // Adicionar ao mapa
      if (!announcementMap.has(itemId)) {
        announcementMap.set(itemId, {
          itemId,
          productName,
          totalUnitsSold: 0,
          variations: [],
        });
      }

      const announcement = announcementMap.get(itemId);
      if (announcement) {
        announcement.totalUnitsSold += unitsSold;
        announcement.variations.push({
          itemId,
          variationId,
          variationName,
          unitsSold,
          salesBRL,
          conversionRate,
          consumo30Days,
          consumoDailyAvg,
        });
      }
    }

    // Ordenar variações por unidades vendidas (decrescente)
    const announcements = Array.from(announcementMap.values());
    announcements.forEach((ad) => {
      ad.variations.sort((a, b) => b.unitsSold - a.unitsSold);
    });

    // Ordenar anúncios por total de unidades vendidas (decrescente)
    announcements.sort((a, b) => b.totalUnitsSold - a.totalUnitsSold);

    // Top 5 anúncios
    const topAnnouncements = announcements.slice(0, 5);

    return {
      startDate: startDate || 'Unknown',
      endDate: endDate || 'Unknown',
      announcements,
      topAnnouncements,
    };
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error(`Failed to process Excel file: ${error}`);
  }
}

// Função para gerar relatório em Markdown
export function generateMarkdownReport(data: ProcessedData): string {
  let report = '# Relatório Estratégico de Performance de Variações\n\n';
  report += `**Período da Análise:** ${data.startDate} a ${data.endDate}\n\n`;
  report += 'Este relatório detalha a performance das variações de cada anúncio, com foco no consumo de unidades vendidas.\n\n';
  report += '---\n\n';

  for (const announcement of data.announcements) {
    if (announcement.totalUnitsSold === 0) {
      continue;
    }

    report += `## Anúncio: ${announcement.productName} (ID: ${announcement.itemId})\n\n`;
    report += `**Total de Unidades Vendidas (30 Dias):** ${announcement.totalUnitsSold.toFixed(0)}\n\n`;

    // Criar tabela
    report += '| Variação | Consumo (Unidades 30d) | Consumo Diário Médio | Participação (%) | Vendas (BRL) | Taxa Conversão |\n';
    report += '|:---------|:----------------------:|:-------------------:|:----------------:|:------------:|:---------------:|\n';

    for (const variation of announcement.variations) {
      const participation = (variation.unitsSold / announcement.totalUnitsSold) * 100;
      const salesFormatted = `R$ ${variation.salesBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const conversionFormatted = `${variation.conversionRate.toFixed(2)}%`;

      report += `| ${variation.variationName} | ${variation.consumo30Days.toFixed(0)} | ${variation.consumoDailyAvg.toFixed(2)} | ${participation.toFixed(2)}% | ${salesFormatted} | ${conversionFormatted} |\n`;
    }

    report += '\n---\n\n';
  }

  return report;
}

// Função para gerar dados para gráficos
export function generateChartData(data: ProcessedData) {
  const chartData = {
    grouped: [] as any[],
    stacked: [] as any[],
  };

  // Dados para gráfico de barras agrupadas (Top 5)
  for (const announcement of data.topAnnouncements) {
    const topVariations = announcement.variations.slice(0, 5);
    const otherUnits = announcement.variations.slice(5).reduce((sum, v) => sum + v.unitsSold, 0);

    const announcementData = {
      itemId: announcement.itemId,
      productName: announcement.productName,
      totalUnits: announcement.totalUnitsSold,
      variations: topVariations.map((v) => ({
        name: v.variationName,
        units: v.unitsSold,
      })),
    };

    if (otherUnits > 0) {
      announcementData.variations.push({
        name: 'Outras Variações',
        units: otherUnits,
      });
    }

    chartData.grouped.push(announcementData);
  }

  // Dados para gráfico de barras empilhadas (participação percentual)
  for (const announcement of data.topAnnouncements) {
    const topVariations = announcement.variations.slice(0, 5);
    const otherUnits = announcement.variations.slice(5).reduce((sum, v) => sum + v.unitsSold, 0);

    const announcementData = {
      itemId: announcement.itemId,
      productName: announcement.productName,
      totalUnits: announcement.totalUnitsSold,
      variations: topVariations.map((v) => ({
        name: v.variationName,
        percentage: (v.unitsSold / announcement.totalUnitsSold) * 100,
      })),
    };

    if (otherUnits > 0) {
      announcementData.variations.push({
        name: 'Outras Variações',
        percentage: (otherUnits / announcement.totalUnitsSold) * 100,
      });
    }

    chartData.stacked.push(announcementData);
  }

  return chartData;
}
