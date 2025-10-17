import type { FastifyInstance } from 'fastify';
import type { EventsService } from '../services/events-service';

export async function eventsRoutes(fastify: FastifyInstance, service: EventsService) {
  // GET /events - Retorna os eventos (com cache)
  fastify.get('/events', async (_request, reply) => {
    try {
      const events = await service.getEvents();
      return reply.send({
        success: true,
        data: events,
        cachedAt: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      fastify.log.error(error, 'Erro ao buscar eventos:');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar eventos',
        message: errorMessage
      });
    }
  });

  // GET /health - Health check + validação de schema
  fastify.get('/health', async (_request, reply) => {
    try {
      const validation = await service.validateSchema();
      console.info({ validation });
      const status = validation.isValid ? 200 : 503;
      return reply.status(status).send({
        success: validation.isValid,
        status: validation.isValid ? 'healthy' : 'unhealthy',
        schemaValidation: {
          isValid: validation.isValid,
          errors: validation.errors
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      fastify.log.error(error, 'Erro no health check:');

      return reply.status(503).send({
        success: false,
        status: 'unhealthy',
        error: 'Erro ao validar schema',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });
}
