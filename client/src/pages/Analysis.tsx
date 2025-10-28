import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, AlertCircle, FileText } from 'lucide-react';
import { Streamdown } from 'streamdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type File = {
  id: number;
  fileName: string;
  s3Key: string;
};
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { Streamdown } from 'streamdown';

export default function Analysis() {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFileMutation = trpc.analysis.processFile.useMutation();
  const { data: uploadedFiles, isLoading: isLoadingFiles } = trpc.upload.list.useQuery();

  const handleAnalyze = async () => {
    const fileToAnalyze = uploadedFiles?.find(f => f.id === selectedFileId);

    if (!fileToAnalyze) {
      setError('Por favor, selecione um arquivo para análise');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chamar o procedimento tRPC
      const result = await processFileMutation.mutateAsync({
        filePath: fileToAnalyze.s3Key, // Agora enviamos a chave S3
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (result.success) {
        setAnalysisResult(result);
      } else {
        setError(result.error || 'Erro ao processar arquivo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ad Performance Analyzer
          </h1>
          <p className="text-gray-600">
            Analise a performance de suas variações de anúncios e obtenha insights estratégicos
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload de Dados</CardTitle>
            <CardDescription>
              Carregue sua planilha Excel com os dados de performance dos anúncios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Selection */}
            {isLoadingFiles ? (
              <div className="flex items-center justify-center p-8 border rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregando arquivos...
              </div>
            ) : uploadedFiles && uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Selecione o Arquivo para Análise
                </label>
                <Select
                  value={selectedFileId?.toString() || ""}
                  onValueChange={(value) => setSelectedFileId(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um arquivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {uploadedFiles.map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          {file.fileName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Gerencie seus uploads na aba "Arquivos".
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-yellow-50/50">
                <AlertCircle className="h-6 w-6 text-yellow-600 mb-2" />
                <p className="text-sm font-medium text-yellow-800">
                  Nenhum arquivo encontrado.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Por favor, faça upload de um arquivo na aba "Arquivos".
                </p>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Selecione a data de início"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Selecione a data de fim"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Erro</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!selectedFileId || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Analisar Dados'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysisResult && (
          <div className="space-y-8">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Grouped Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Gráfico de Barras Agrupadas</CardTitle>
                  <CardDescription>
                    Performance das variações (Top 5 anúncios)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <p className="text-gray-500">
                      Gráfico será renderizado aqui
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stacked Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Gráfico de Barras Empilhadas</CardTitle>
                  <CardDescription>
                    Participação percentual das variações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <p className="text-gray-500">
                      Gráfico será renderizado aqui
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report */}
            <Card>
              <CardHeader>
                <CardTitle>Relatório Estratégico</CardTitle>
                <CardDescription>
                  Análise detalhada de performance por anúncio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{analysisResult.report}</Streamdown>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
