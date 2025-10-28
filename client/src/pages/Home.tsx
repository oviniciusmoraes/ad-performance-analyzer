import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { BarChart3, TrendingUp, Zap } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/analysis');
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8" />}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <Button onClick={handleGetStarted} variant="default">
            {isAuthenticated ? 'Ir para Analise' : 'Entrar'}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Analise Inteligente de Performance de Anuncios
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Carregue seus dados de performance, obtenha relatorios estrategicos e visualize insights em tempo real com graficos interativos.
          </p>
          <Button onClick={handleGetStarted} size="lg" className="px-8 py-3 text-lg">
            Comecar Agora
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-md p-6">
            <BarChart3 className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Graficos Inteligentes</h3>
            <p className="text-gray-600">
              Visualize a performance de suas variacoes com graficos de barras agrupadas e empilhadas.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Relatorios Detalhados</h3>
            <p className="text-gray-600">
              Obtenha analises estrategicas com metricas de consumo, participacao e vendas por anuncio.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <Zap className="h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Processamento Rapido</h3>
            <p className="text-gray-600">
              Carregue suas planilhas Excel e obtenha resultados instantaneamente com filtros por periodo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
