# 🚀 Guia Rápido - Infoeste Scraping

## Início Rápido (Quick Start)

### 1️⃣ Instalação
```bash
npm install
```

### 2️⃣ Configuração

Crie os arquivos `.env`:

**Backend** (`packages/backend/.env`):
```bash
PORT=3000
CACHE_TTL_SECONDS=300
NODE_ENV=development
```

**Frontend** (`apps/web/.env`):
```bash
VITE_API_URL=http://localhost:3000
```

### 3️⃣ Executar

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev:web
```

### 4️⃣ Acessar

- Frontend: http://localhost:5173
- API Backend: http://localhost:3000
- Health Check: http://localhost:3000/health
- Eventos: http://localhost:3000/events

## 📡 Rotas da API

### GET /events
Retorna lista de eventos (com cache).

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": [
    {
      "title": "37º Ciclo de Cursos",
      "courses": [
        {
          "id": 9470,
          "name": "Introdução ao Python",
          "date": "31/10/2025",
          "periodTime": "19:00 às 22:30",
          "startTime": "19:00",
          "endTime": "22:30",
          "vacancies": 30,
          "vacanciesLeft": 9
        }
      ]
    }
  ],
  "cachedAt": "2025-10-16T10:30:00.000Z"
}
```

### GET /health
Verifica se o serviço está funcionando e se a estrutura HTML está correta.

**Resposta (saudável):**
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

**Resposta (problema detectado):**
```json
{
  "success": false,
  "status": "unhealthy",
  "schemaValidation": {
    "isValid": false,
    "errors": [
      "Elemento #listaHorarios não encontrado"
    ]
  },
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

## ⚙️ Configurações

### Cache TTL (Tempo de Vida)

Ajuste `CACHE_TTL_SECONDS` no `.env` do backend:

```bash
# Exemplos:
CACHE_TTL_SECONDS=60    # 1 minuto
CACHE_TTL_SECONDS=300   # 5 minutos (padrão)
CACHE_TTL_SECONDS=600   # 10 minutos
CACHE_TTL_SECONDS=1800  # 30 minutos
```

### Porta do Servidor

Altere `PORT` no `.env` do backend:

```bash
PORT=3001  # ou qualquer outra porta disponível
```

**Importante:** Atualize também `VITE_API_URL` no frontend:
```bash
VITE_API_URL=http://localhost:3001
```

## 🐛 Problemas Comuns

### "The paging file is too small"
- Memória virtual do Windows insuficiente
- O servidor continuará rodando
- Puppeteer será inicializado na primeira requisição

### "CORS Error"
- Certifique-se que o backend está rodando
- Verifique `VITE_API_URL` no `.env` do frontend

### Frontend mostra "Serviço Indisponível"
Causas possíveis:
1. Backend não está rodando → Inicie com `npm run dev`
2. Estrutura HTML mudou → Verifique `GET /health`
3. Timeout ao acessar site → Verifique conexão

### Porta já está em uso
```bash
# Windows (encontrar processo)
netstat -ano | findstr :3000

# Matar processo (substituir PID)
taskkill /PID <número_do_processo> /F

# Ou altere a porta no .env
```

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia backend
npm run dev:web          # Inicia frontend

# Build
npm run build            # Build de todos os pacotes

# Produção
npm start                # Backend em produção

# Qualidade de código
npm run lint             # Verificar código
npm run fmt:fix          # Formatar código

# Limpeza
npm run clean            # Remover artefatos de build
```

## 🔄 Fluxo de Atualização de Dados

```
┌─────────────┐
│   Cliente   │
│  (Browser)  │
└──────┬──────┘
       │
       │ GET /events
       ▼
┌─────────────┐
│   Backend   │
│  (Fastify)  │
└──────┬──────┘
       │
       ├─► Cache válido? ──► SIM ──► Retorna do cache
       │
       └─► NÃO
           │
           ▼
      ┌──────────┐
      │Puppeteer │
      │ Manager  │
      └────┬─────┘
           │
           ▼
      Extrai dados
           │
           ▼
      Salva no cache
           │
           ▼
      Retorna dados
```

## 📊 Monitoramento

### Ver logs do backend
Os logs aparecem automaticamente no terminal onde o backend está rodando.

### Verificar cache
```bash
# Primeira chamada (sem cache)
curl http://localhost:3000/events
# Resposta demora alguns segundos

# Segunda chamada (com cache)
curl http://localhost:3000/events
# Resposta instantânea
```

### Verificar saúde
```bash
curl http://localhost:3000/health
```

## 🎯 Testando Localmente

### Teste 1: Cache funcionando
```bash
# Terminal 1: Inicie o backend
npm run dev

# Terminal 2: Faça a primeira requisição
curl http://localhost:3000/events

# Espere aparecer "Eventos armazenados no cache"

# Faça segunda requisição
curl http://localhost:3000/events

# Deve aparecer "Retornando eventos do cache"
```

### Teste 2: Health Check
```bash
curl http://localhost:3000/health | json_pp
```

### Teste 3: Frontend
1. Inicie backend: `npm run dev`
2. Inicie frontend: `npm run dev:web`
3. Abra http://localhost:5173
4. Deve carregar a tabela de eventos

## 💡 Dicas

1. **Sempre inicie o backend primeiro** antes do frontend
2. **Use TTL alto** (10+ minutos) se o site raramente atualiza
3. **Use TTL baixo** (1-2 minutos) se precisa de dados frescos
4. **Monitor /health** periodicamente para detectar mudanças
5. **Em produção**, use headless: true no Puppeteer

## 🚀 Próximos Passos

Após validar que tudo funciona:

1. Ajuste o TTL para suas necessidades
2. Configure proxy reverso (nginx) se necessário
3. Considere deploy (Vercel, Railway, etc)
4. Implemente monitoramento (Sentry, LogRocket)
5. Adicione testes automatizados

---

**Precisa de ajuda?** Verifique o arquivo `CHANGELOG.md` para detalhes completos da implementação.
