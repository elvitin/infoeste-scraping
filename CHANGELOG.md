# 🎉 Modificações Implementadas - Infoeste Scraping

## ✅ O que foi feito

### 1. Novo Backend API (`@infoeste/backend`)

Criado um servidor backend completo com Fastify substituindo o módulo `@infoeste/scraper`:

**Funcionalidades:**
- ✅ Servidor Fastify com CORS habilitado
- ✅ Puppeteer persistente em modo headless
- ✅ Browser mantido sempre aberto (lazy initialization)
- ✅ Sistema de cache em memória com TTL configurável
- ✅ Validação de variáveis de ambiente com Zod
- ✅ Graceful shutdown (encerramento limpo)
- ✅ Logs estruturados

**Rotas:**
- `GET /events` - Retorna eventos com cache inteligente
- `GET /health` - Health check + validação de schema HTML

### 2. Sistema de Cache com TTL

**Implementação:**
- Cache em memória usando `Map` nativo
- TTL configurável via variável de ambiente `CACHE_TTL_SECONDS`
- Padrão: 300 segundos (5 minutos)
- Invalidação automática após expiração
- Método `invalidate()` para limpeza manual

**Classe:** `CacheManager<T>` em `src/cache/cache-manager.ts`

### 3. Validação de Schema HTML

**Implementação:**
- Validador estrutural que verifica a integridade do DOM
- Valida seletores CSS críticos
- Verifica estrutura hierárquica esperada
- Conta mínima de colunas e linhas
- Retorna lista detalhada de erros

**Verificações:**
- ✅ Elemento `#listaHorarios` existe
- ✅ Estrutura `li > .tituloDoTipo + table > tbody > tr`
- ✅ Cabeçalho com mínimo 4 colunas
- ✅ Linhas de dados com links na primeira coluna
- ✅ Quantidade adequada de eventos

**Classe:** `HTMLSchemaValidator` em `src/validators/html-schema-validator.ts`

### 4. Puppeteer Manager

**Implementação:**
- Gerencia ciclo de vida do browser
- Lazy initialization (inicializa sob demanda)
- Mantém página aberta e reutilizável
- Método `reload()` para atualizar página
- Cleanup automático no shutdown
- Thread-safe (evita inicializações duplas)

**Classe:** `PuppeteerManager` em `src/puppeteer/puppeteer-manager.ts`

### 5. Frontend Atualizado

**Modificações em `apps/web/src/app.tsx`:**
- ✅ Removido fetch de arquivo estático `events.json`
- ✅ Adicionado fetch para API `/events`
- ✅ Health check automático antes de buscar eventos
- ✅ Mensagem de "Serviço Indisponível" quando schema HTML mudou
- ✅ Variável de ambiente `VITE_API_URL` para configurar URL da API

### 6. Reestruturação de Módulos

**Antes:**
```
packages/
├── core/           (tipos compartilhados)
├── infrastructure/ (implementação Puppeteer)
└── scraper/        (CLI obsoleto)
```

**Depois:**
```
packages/
├── core/    (tipos compartilhados)
└── backend/ (API Fastify + Puppeteer + Cache + Validação)
```

**Justificativa:**
- `@infoeste/scraper` removido (substituído pelo backend API)
- `@infoeste/infrastructure` renomeado para `@infoeste/backend`
- Arquitetura cliente-servidor mais clara
- Separação de responsabilidades

## 📁 Arquivos Criados

### Backend
```
packages/backend/
├── src/
│   ├── cache/
│   │   └── cache-manager.ts
│   ├── config/
│   │   └── env.ts
│   ├── puppeteer/
│   │   └── puppeteer-manager.ts
│   ├── repositories/
│   │   └── puppeteer-course-repository.ts
│   ├── routes/
│   │   └── events.ts
│   ├── services/
│   │   └── events-service.ts
│   ├── validators/
│   │   └── html-schema-validator.ts
│   ├── index.ts
│   └── server.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

### Frontend
```
apps/web/
├── .env
└── .env.example
```

### Raiz
```
README.md (atualizado)
package.json (scripts atualizados)
```

## ⚙️ Configuração

### Backend (`packages/backend/.env`)
```bash
PORT=3000
CACHE_TTL_SECONDS=300
NODE_ENV=development
```

### Frontend (`apps/web/.env`)
```bash
VITE_API_URL=http://localhost:3000
```

## 🚀 Como Usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o backend (Terminal 1)
```bash
npm run dev
# ou
npm run dev --workspace @infoeste/backend
```

Saída esperada:
```
🚀 Inicializando Puppeteer...
Iniciando browser Puppeteer...
Navegando para a página de cursos...
Puppeteer inicializado com sucesso!
✅ Puppeteer pronto!
🌐 Servidor rodando em http://localhost:3000
⏱️  Cache TTL: 300 segundos
```

### 3. Iniciar o frontend (Terminal 2)
```bash
npm run dev:web
```

### 4. Testar as rotas

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Buscar Eventos:**
```bash
curl http://localhost:3000/events
```

## 🔄 Fluxo de Funcionamento

### Primeira Requisição
1. Cliente chama `GET /events`
2. Backend verifica cache (vazio)
3. Backend inicializa Puppeteer (se necessário)
4. Backend extrai dados da página
5. Backend armazena no cache com timestamp
6. Backend retorna dados ao cliente

### Requisições Subsequentes (dentro do TTL)
1. Cliente chama `GET /events`
2. Backend verifica cache (válido)
3. Backend retorna dados do cache imediatamente

### Após Expiração do Cache
1. Cliente chama `GET /events`
2. Backend verifica cache (expirado)
3. Backend recarrega página ou extrai novamente
4. Backend atualiza cache
5. Backend retorna novos dados

### Health Check
1. Cliente chama `GET /health`
2. Backend inicializa Puppeteer (se necessário)
3. Backend navega e seleciona categoria
4. Backend valida estrutura HTML
5. Backend retorna status (healthy/unhealthy)

## 🎯 Requisitos Atendidos

### ✅ Backend com Puppeteer persistente
- Browser aberto em modo headless
- Página mantida em memória
- Timeout tratado e reportado ao usuário

### ✅ Fastify + Zod
- Servidor Fastify configurado
- Variáveis de ambiente validadas com Zod
- Rotas tipadas

### ✅ Sistema de Cache
- Cache em memória implementado
- TTL configurável (padrão: 5 minutos)
- Pode ser ajustado via `.env`

### ✅ Validação de Schema HTML
- Rota `/health` implementada
- Validação estrutural completa
- Frontend detecta mudanças e exibe mensagem

### ✅ Avaliação de Módulos
- `@infoeste/scraper` removido
- `@infoeste/infrastructure` → `@infoeste/backend`
- `@infoeste/core` mantido (compartilhado)

## 🐛 Troubleshooting

### Erro: "The paging file is too small"
**Causa:** Memória virtual do Windows insuficiente  
**Solução:** 
1. Aumentar arquivo de paginação do Windows
2. Ou aguardar - o Puppeteer será inicializado na primeira requisição
3. O servidor continua funcionando normalmente

### Porta 3000 ocupada
Altere `PORT` no arquivo `packages/backend/.env`

### CORS Error
Certifique-se que:
1. Backend está rodando
2. `VITE_API_URL` no frontend está correto
3. CORS está habilitado no backend (já configurado)

### Frontend mostra "Serviço Indisponível"
Possíveis causas:
1. Backend não está rodando
2. Health check detectou mudança na estrutura HTML
3. Timeout ao acessar a página da Infoeste

## 📊 Comparação Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Arquitetura | Scraper CLI + JSON estático | API REST + Frontend |
| Atualização | Manual (executar scraper) | Automática (cache com TTL) |
| Validação | Nenhuma | Health check com validação |
| Browser | Abre e fecha a cada execução | Persistente (headless) |
| Cache | Nenhum | Em memória com TTL |
| Feedback | Apenas no terminal | API + UI com estados |
| Módulos | 4 (core, infra, scraper, web) | 3 (core, backend, web) |

## 🎓 Tecnologias Utilizadas

- **Fastify** - Framework web rápido e low overhead
- **Puppeteer** - Automação de browser
- **Zod** - Validação de schemas
- **TypeScript** - Tipagem estática
- **dotenv** - Gerenciamento de variáveis de ambiente
- **@fastify/cors** - Habilitação de CORS

## 📝 Próximos Passos (Opcional)

- [ ] Adicionar rate limiting
- [ ] Implementar Redis para cache distribuído
- [ ] Adicionar autenticação
- [ ] Implementar WebSockets para updates em tempo real
- [ ] Adicionar testes unitários e e2e
- [ ] Dockerizar a aplicação
- [ ] CI/CD pipeline
- [ ] Monitoramento e métricas
