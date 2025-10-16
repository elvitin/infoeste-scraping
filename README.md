# Infoeste Scraping

Projeto em monorepo (npm workspaces) que coleta os eventos da INFOESTE com Puppeteer, salva os dados como JSON e disponibiliza uma visualização web construída com Vite + React + shadcn/ui.

## Requisitos

- Node.js v22.18.0 ou superior (recomendado usar a mesma versão via `nvm` ou `fnm`)
- Acesso à internet para que o Puppeteer baixe o Chromium na primeira execução

## Instalação

```bash
npm install
```

Esse comando prepara todas as workspaces definidas em `package.json` (`apps/*` e `packages/*`).

## Comandos principais

- `npm start`: executa o fluxo completo do scraper (`apps/scraper`)
	1. Abre o site oficial da INFOESTE com Puppeteer e extrai a programação.
	2. Salva os dados em `apps/web/public/events.json`.
	3. Gera o build do frontend (`apps/web`).
	4. Sobe o `vite preview` em `http://127.0.0.1:4173` e abre o navegador controlado pelo Puppeteer.
- `npm run build`: gera os artefatos de produção para `@infoeste/core`, `@infoeste/infrastructure`, `@infoeste/web` e `@infoeste/scraper`.
- `npm run lint`: roda o Biome para verificação estática do código.
- `npm run clean`: apaga todos os artefatos gerados (`dist/*` e arquivos `.js/.d.ts/.js.map` dentro de `src`) além do arquivo `apps/web/public/events.json`.

## Execução passo a passo

1. **Instale as dependências**: `npm install`.
2. **Execute o scraper**: `npm start`.
	 - Em ambientes Windows o Puppeteer lança o navegador Chromium automaticamente; caso use outro SO, certifique-se de permitir a abertura de janelas.
	 - Se a página oficial não estiver disponível, o comando exibirá um erro de timeout.
3. **Visualize os dados**: ao final do fluxo o Vite Preview permanecerá rodando em `http://127.0.0.1:4173` até que você feche a janela do Chromium ou interrompa o processo no terminal.

## Execução manual dos pacotes (opcional)

- Rodar apenas o scraper (modo dev, sem abrir preview):
	```bash
	npm run dev --workspace @infoeste/scraper
	```
- Rodar o frontend em modo desenvolvimento (hot reload):
	```bash
	npm run dev --workspace @infoeste/web
	```
- Gerar build do frontend manualmente:
	```bash
	npm run build --workspace @infoeste/web
	```

## Estrutura do monorepo

- `packages/core`: entidades e contratos compartilhados.
- `packages/infrastructure`: implementação Puppeteer do repositório de cursos.
- `apps/scraper`: CLI que orquestra scraping, geração do JSON e preview automático.
- `apps/web`: aplicação Vite/React responsável por renderizar a tabela de eventos.

## Dicas de troubleshooting

- **Erro `net::ERR_CONNECTION_TIMED_OUT`**: verifique sua conexão e se o site da INFOESTE está acessível. O scraper depende dessa página.
- **Erro ao iniciar scripts npm (Windows)**: assegure-se de usar o terminal `cmd.exe` ou PowerShell e de não bloquear a execução de executáveis baixados (Chromium/Puppeteer).
- **Porta 4173 ocupada**: ajuste a porta no arquivo `apps/scraper/src/ui/console.ts` (constante `PREVIEW_PORT`).
- **Limpeza completa**: `npm run clean` remove build artifacts, arquivos `.js/.d.ts/.js.map` deixados nos diretórios `src` e o JSON gerado pelo scraper. Para um reset total (incluindo `node_modules`), exclua manualmente a pasta e rode `npm install` novamente.