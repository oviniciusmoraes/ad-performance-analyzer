import { ProcessedData } from './dataProcessor';
import * as fs from 'fs';
import * as path from 'path';

// Tipos para dados de gráficos
export interface ChartGeneratorResult {
  groupedChartPath?: string;
  stackedChartPath?: string;
  error?: string;
}

// Função para gerar gráficos usando Python (chamada externa)
export async function generateCharts(
  data: ProcessedData,
  outputDir: string
): Promise<ChartGeneratorResult> {
  try {
    // Criar diretório se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Preparar dados para o script Python
    const chartDataPath = path.join(outputDir, 'chart_data.json');
    const chartData = {
      startDate: data.startDate,
      endDate: data.endDate,
      topAnnouncements: data.topAnnouncements.map((ad) => ({
        itemId: ad.itemId,
        productName: ad.productName,
        totalUnitsSold: ad.totalUnitsSold,
        variations: ad.variations.slice(0, 6).map((v) => ({
          variationName: v.variationName,
          unitsSold: v.unitsSold,
          percentage: (v.unitsSold / ad.totalUnitsSold) * 100,
        })),
      })),
    };

    fs.writeFileSync(chartDataPath, JSON.stringify(chartData, null, 2));

    // Retornar os caminhos dos gráficos (serão gerados pelo frontend ou por um worker)
    return {
      groupedChartPath: path.join(outputDir, 'grouped_chart.png'),
      stackedChartPath: path.join(outputDir, 'stacked_chart.png'),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Função para gerar dados de gráfico em formato JSON (para uso no frontend)
export function generateChartDataJSON(data: ProcessedData) {
  const groupedData = data.topAnnouncements.map((ad) => {
    const topVariations = ad.variations.slice(0, 5);
    const otherUnits = ad.variations.slice(5).reduce((sum, v) => sum + v.unitsSold, 0);

    const variations = topVariations.map((v) => ({
      name: v.variationName,
      units: v.unitsSold,
    }));

    if (otherUnits > 0) {
      variations.push({
        name: 'Outras Variações',
        units: otherUnits,
      });
    }

    return {
      itemId: ad.itemId,
      productName: ad.productName,
      totalUnits: ad.totalUnitsSold,
      variations,
    };
  });

  const stackedData = data.topAnnouncements.map((ad) => {
    const topVariations = ad.variations.slice(0, 5);
    const otherUnits = ad.variations.slice(5).reduce((sum, v) => sum + v.unitsSold, 0);

    const variations = topVariations.map((v) => ({
      name: v.variationName,
      percentage: (v.unitsSold / ad.totalUnitsSold) * 100,
    }));

    if (otherUnits > 0) {
      variations.push({
        name: 'Outras Variações',
        percentage: (otherUnits / ad.totalUnitsSold) * 100,
      });
    }

    return {
      itemId: ad.itemId,
      productName: ad.productName,
      totalUnits: ad.totalUnitsSold,
      variations,
    };
  });

  return {
    grouped: groupedData,
    stacked: stackedData,
  };
}
