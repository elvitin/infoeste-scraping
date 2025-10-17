# @infoeste/backend

Backend API para scraping e fornecimento de dados de eventos da Infoeste.

## Funcionalidades

- 🚀 **API REST com Fastify** - Servidor HTTP rápido e eficiente
- 🔄 **Cache com TTL configurável** - Sistema de cache em memória para otimizar requisições
- 🤖 **Puppeteer persistente** - Instância do Chromium mantida sempre aberta
- ✅ **Validação de Schema HTML** - Health check que verifica a estrutura do DOM
- 🔒 **Validação com Zod** - Validação de tipos e dados de entrada

## Rotas Disponíveis

### `GET /events`

Retorna a lista de eventos com seus cursos.

**Resposta de sucesso:**
```json
{
  "success": true,
  "data": [
    {
      "title": "37º Ciclo de Cursos",
      "courses": [...]
    }
  ],
  "cachedAt": "2025-10-16T10:30:00.000Z"
}
```

### `GET /health`

Verifica a saúde do serviço e valida a estrutura HTML da página.

**Resposta de sucesso:**
```json
{
  "success": true,
  "status": "healthy",
  "schemaValidation": {
    "isValid": true,
    "errors": []
  },
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

**Resposta de erro (estrutura inválida):**
```json
{
  "success": false,
  "status": "unhealthy",
  "schemaValidation": {
    "isValid": false,
    "errors": ["Elemento #listaHorarios não encontrado"]
  },
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

## Configuração

Crie um arquivo `.env` baseado no `.env.example`:

```bash
PORT=3000
CACHE_TTL_SECONDS=300
NODE_ENV=development
```

### Variáveis de Ambiente

- `PORT` - Porta do servidor (padrão: 3000)
- `CACHE_TTL_SECONDS` - Tempo de expiração do cache em segundos (padrão: 300 = 5 minutos)
- `NODE_ENV` - Ambiente de execução (development, production, test)

## Scripts

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build
npm run build

# Produção
npm start
```

## Arquitetura

```
src/
├── cache/
│   └── cache-manager.ts       # Gerenciador de cache com TTL
├── config/
│   └── env.ts                 # Configuração de variáveis de ambiente
├── puppeteer/
│   └── puppeteer-manager.ts   # Gerenciador de instância persistente
├── repositories/
│   └── puppeteer-course-repository.ts  # Repositório de scraping
├── routes/
│   └── events.ts              # Rotas da API
├── services/
│   └── events-service.ts      # Lógica de negócio
├── validators/
│   └── html-schema-validator.ts  # Validador de estrutura HTML
├── index.ts                   # Exports públicos
└── server.ts                  # Servidor Fastify
```

## Sistema de Cache

O cache armazena os eventos em memória com tempo de expiração configurável:

- Primeira requisição: busca dados da página
- Requisições subsequentes: retorna do cache (se não expirado)
- Após expiração do TTL: busca novos dados automaticamente

## Health Check

A rota `/health` valida:

- ✅ Presença do elemento `#listaHorarios`
- ✅ Estrutura de eventos (`li > .tituloDoTipo + table`)
- ✅ Cabeçalhos da tabela (mínimo 4 colunas)
- ✅ Linhas de dados com links válidos
- ✅ Quantidade adequada de colunas por linha

Se a estrutura HTML mudar, o frontend detectará e mostrará mensagem de "serviço indisponível".
