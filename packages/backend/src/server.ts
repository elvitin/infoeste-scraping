import cors from '@fastify/cors';
import type { InfoesteEvent } from '@infoeste/core';
import Fastify from 'fastify';
import { CacheManager } from './cache/cache-manager';
import { env } from './config/env';
import { PuppeteerManager } from './puppeteer/puppeteer-manager';
import { PuppeteerCourseRepository } from './repositories/puppeteer-course-repository';
import { eventsRoutes } from './routes/events';
import { EventsService } from './services/events-service';
import { HTMLSchemaValidator } from './validators/html-schema-validator';

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'error'
  }
});

// Instâncias globais
const puppeteerManager = new PuppeteerManager();
const cache = new CacheManager<InfoesteEvent[]>(env.CACHE_TTL_SECONDS);
const validator = new HTMLSchemaValidator();
const repository = new PuppeteerCourseRepository(puppeteerManager);
const eventsService = new EventsService(repository, cache, validator, puppeteerManager);

// Configurar CORS
await fastify.register(cors, {
  origin: true // Permitir todas as origens em desenvolvimento
});

// Registrar rotas
await eventsRoutes(fastify, eventsService);

// Hook de inicialização
fastify.addHook('onReady', async () => {
  try {
    console.log('🚀 Inicializando Puppeteer...');
    await puppeteerManager.initialize();
    console.log('✅ Puppeteer pronto!');
  } catch (error) {
    console.error('❌ Erro ao inicializar Puppeteer:', error);
    console.warn(
      '⚠️  O servidor continuará rodando, mas as requisições falharão até que o Puppeteer seja inicializado com sucesso'
    );
    // Não lançar o erro para permitir que o servidor continue rodando
    // O Puppeteer será inicializado na primeira requisição
  }
});

// Hook de encerramento gracioso
fastify.addHook('onClose', async () => {
  console.log('🛑 Encerrando servidor...');
  await puppeteerManager.cleanup();
});

// Tratamento de sinais para encerramento gracioso
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} recebido, encerrando graciosamente...`);
  await fastify.close();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Iniciar servidor
(async () => {
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🌐 Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`⏱️ Cache TTL: ${env.CACHE_TTL_SECONDS} segundos`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
