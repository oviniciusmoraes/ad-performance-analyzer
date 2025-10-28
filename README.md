# Ad Performance Analyzer

Um analisador inteligente de performance de anúncios com gerenciamento de arquivos e interface em tema escuro.

## Funcionalidades

- **Análise de Performance:** Carregue seus dados de performance, obtenha relatórios estratégicos e visualize insights em tempo real com gráficos interativos.
- **Gerenciamento de Arquivos:** Faça upload de novas planilhas, visualize seus arquivos carregados e exclua arquivos que não precisa mais.
- **Interface Escura:** Layout moderno inspirado na interface do Manus com tema escuro.
- **Relatórios Detalhados:** Análises estratégicas com métricas de consumo, participação e vendas por anúncio.

## Requisitos

- Node.js 18+ 
- pnpm (ou npm/yarn)
- MySQL 8.0+

## Instalação Local

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar migrações do banco de dados
pnpm drizzle-kit migrate

# Iniciar servidor de desenvolvimento
pnpm dev
```

O site estará disponível em `http://localhost:3000`.

## Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL=mysql://usuario:senha@host:porta/database

# OAuth
OAUTH_SERVER_URL=https://seu-servidor-oauth.com

# Armazenamento
BUILT_IN_FORGE_API_URL=https://seu-api-armazenamento.com
BUILT_IN_FORGE_API_KEY=sua-chave-api

# Proprietário
OWNER_OPEN_ID=seu-open-id
```

## Implantação no Vercel

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. O Vercel fará o deploy automático a cada push para a branch `master`

### Variáveis de Ambiente no Vercel

Adicione as seguintes variáveis de ambiente no painel do Vercel:

- `DATABASE_URL` - URL de conexão MySQL
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- `BUILT_IN_FORGE_API_URL` - URL da API de armazenamento
- `BUILT_IN_FORGE_API_KEY` - Chave da API de armazenamento
- `OWNER_OPEN_ID` - ID do proprietário

## Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários
│   │   └── index.css      # Estilos globais
│   └── index.html
├── server/                # Backend Node.js/Express
│   ├── _core/            # Configuração central
│   ├── routers.ts        # Rotas tRPC
│   ├── uploadRouter.ts   # Rotas de upload
│   └── storage.ts        # Utilitários de armazenamento
├── drizzle/              # Migrações do banco de dados
├── shared/               # Código compartilhado
└── package.json
```

## Tecnologias

- **Frontend:** React, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Express, tRPC, Drizzle ORM
- **Banco de Dados:** MySQL
- **Autenticação:** OAuth 2.0
- **Armazenamento:** API de armazenamento customizada

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Executar testes
pnpm test

# Build para produção
pnpm build

# Iniciar servidor de produção
pnpm start
```

## Licença

MIT

## Suporte

Para suporte, abra uma issue no repositório do GitHub.
