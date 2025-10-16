import type { Browser, Frame, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import type { Event, InfoesteEvent, ICourseRepository } from '@infoeste/core';

export class PuppeteerCourseRepository implements ICourseRepository {
  private readonly URL = 'https://www.unoeste.br/semanas/2025/37infoeste/CursosPalestras';

  async getGroupedEvents(): Promise<InfoesteEvent[]> {
    const browser = await this.launchBrowser();
    const page = await this.newPage(browser);

    try {
      await this.navigateToPage(page);
      const iframe = await page.waitForSelector('#iframeAtividades');
      const frame = await iframe?.contentFrame();
      if (!frame) {
        throw new Error('Não foi possível acessar o iframe de cursos');
      }

      await this.selectParticipantCategory(frame);
      const events = await this.extractEvents(frame);
      return events;
    } finally {
      await browser.close();
    }
  }

  private async launchBrowser(): Promise<Browser> {
    return puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });
  }

  private async newPage(browser: Browser): Promise<Page> {
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.setViewport(null);
    return page;
  }

  private async navigateToPage(page: Page): Promise<void> {
    await page.goto(this.URL, { waitUntil: 'networkidle2' });
  }

  private async selectParticipantCategory(frame: Frame): Promise<void> {
    const categorySelector = '#ddlCat';
    const categoryValue = '4384';
    await frame.waitForSelector(categorySelector);
    await frame.select(categorySelector, categoryValue);
    await frame.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  private async extractEvents(frame: Frame): Promise<InfoesteEvent[]> {
    await frame.waitForSelector('#listaHorarios');
    const events = (await frame.evaluate(() => {
      const parsedEvents: InfoesteEvent[] = [];
      const eventElements = document.querySelectorAll('#listaHorarios > li');

      eventElements.forEach(eventElement => {
        const titleElement = eventElement.querySelector('.tituloDoTipo');
        const title = titleElement ? (titleElement.textContent?.trim() ?? '') : '';

        const courseRows = eventElement.querySelectorAll('table tbody tr:not(:first-child)');

        let currentDate = '';
        const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
        const dateHeader = eventElement.querySelector('table tbody tr:first-child th:first-child');
        if (dateHeader) {
          const dateMatch = dateHeader.textContent?.match(dateRegex);
          if (!dateMatch) {
            throw new Error('Data não encontrada');
          }
          currentDate = dateMatch[0];
        }

        const courses: Event[] = [];
        courseRows.forEach(row => {
          const columns = row.querySelectorAll('td');
          if (columns.length >= 4) {
            const courseNameElement = columns[0].querySelector('a');
            let courseName = courseNameElement ? (courseNameElement.textContent?.trim() ?? '') : '';
            courseName = courseName.replace(/\s+/g, ' ').trim();

            const idMatch = courseName.match(/\(\s*(\d+)\s*\)/);
            const id = idMatch ? Number.parseInt(idMatch[1], 10) : 0;

            const time = columns[1].textContent?.trim() ?? '';
            const startTime = time.split('às')[0].trim() ?? '';
            const endTime = time.split('às')[1].trim() ?? '';

            const vacancies = Number.parseInt(columns[2].textContent?.trim() ?? '0', 10);
            const vacanciesLeft = Number.parseInt(columns[3].textContent?.trim() ?? '0', 10);

            courses.push({
              id,
              name: courseName.replace(/\(\s*(\d+)\s*\)\s*-\s*/, '').trim(),
              date: currentDate,
              periodTime: time,
              startTime,
              endTime,
              vacancies,
              vacanciesLeft
            });
          }
        });

        if (title && courses.length > 0) {
          parsedEvents.push({
            title,
            courses
          });
        }
      });

      return parsedEvents;
    })) as InfoesteEvent[];

    return events;
  }
}
