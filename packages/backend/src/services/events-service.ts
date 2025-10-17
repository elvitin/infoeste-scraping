import type { InfoesteEvent } from '@infoeste/core';
import type { CacheManager } from '../cache/cache-manager';
import type { PuppeteerManager } from '../puppeteer/puppeteer-manager';
import type { PuppeteerCourseRepository } from '../repositories/puppeteer-course-repository';
import type { HTMLSchemaValidator } from '../validators/html-schema-validator';

export class EventsService {
  private readonly CACHE_KEY = 'events';
  private readonly URL = 'https://www.unoeste.br/semanas/2025/37infoeste/CursosPalestras';
  constructor(
    private repository: PuppeteerCourseRepository,
    private cache: CacheManager<InfoesteEvent[]>,
    private validator: HTMLSchemaValidator,
    private puppeteerManager: PuppeteerManager
  ) {}

  async getEvents(): Promise<InfoesteEvent[]> {
    // Tentar retornar do cache primeiro
    const cachedEvents = this.cache.get(this.CACHE_KEY);
    if (cachedEvents) {
      console.log('Retornando eventos do cache');
      return cachedEvents;
    }

    // Buscar novos eventos
    console.log('Cache expirado ou vazio, buscando novos eventos...');
    const events = await this.repository.getGroupedEvents();

    // Armazenar no cache
    this.cache.set(this.CACHE_KEY, events);
    console.log('Eventos armazenados no cache');

    return events;
  }

  async validateSchema(): Promise<{ isValid: boolean; errors: string[] }> {
    const page = await this.puppeteerManager.navigateTo(this.URL);
    const iframe = await page.waitForSelector('#iframeAtividades', { timeout: 10000 });
    const frame = await iframe?.contentFrame();

    if (!frame) {
      return {
        isValid: false,
        errors: ['Não foi possível acessar o iframe de cursos']
      };
    }

    // Selecionar categoria antes de validar
    try {
      const categorySelector = '#ddlCat';
      const categoryValue = '4384';
      await frame.waitForSelector(categorySelector, { timeout: 10000 });
      await frame.select(categorySelector, categoryValue);
      await frame.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (error) {
      return {
        isValid: false,
        errors: [`Erro ao selecionar categoria: ${(error as Error).message}`]
      };
    }

    return await this.validator.validate(frame);
  }
}
