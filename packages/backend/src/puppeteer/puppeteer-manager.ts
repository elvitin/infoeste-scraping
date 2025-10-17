import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

export class PuppeteerManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private readonly TIMEOUT_MS = 30000; // 30 segundos
  private isInitializing = false;
  private lastUrlVisited: string = '';

  async initialize(): Promise<void> {
    if (this.isInitializing) {
      // Aguarda se já está inicializando
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    if (this.browser && this.page) {
      return; // Já inicializado
    }

    this.isInitializing = true;

    try {
      console.log('Iniciando browser Puppeteer...');
      this.browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        defaultViewport: null
      });

      const pages = await this.browser.pages();
      this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();

      console.log('Puppeteer inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar Puppeteer:', error);
      await this.cleanup();
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async getPage(): Promise<Page> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!this.page) {
      throw new Error('Erro ao obter a página do Puppeteer');
    }

    return this.page;
  }

  async reload(): Promise<void> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!this.page) {
      throw new Error('Puppeteer não está inicializado');
    }

    try {
      console.log('Recarregando página...');
      await this.page.reload({
        waitUntil: 'networkidle2',
        timeout: this.TIMEOUT_MS
      });
      console.log('Página recarregada com sucesso!');
    } catch (error) {
      console.error('Erro ao recarregar página:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('Fechando browser...');

    if (this.page) {
      await this.page.close().catch(err => console.error('Erro ao fechar página:', err));
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close().catch(err => console.error('Erro ao fechar browser:', err));
      this.browser = null;
    }

    console.log('Browser fechado!');
  }

  public async navigateTo(url: string, timeout: number = this.TIMEOUT_MS): Promise<Page> {
    if (url === this.lastUrlVisited) {
      await this.reload();
      return this.page!;
    }

    const page = await this.getPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout });
    this.lastUrlVisited = url;

    return page;
  }

  isReady(): boolean {
    return this.browser !== null && this.page !== null && !this.isInitializing;
  }
}
