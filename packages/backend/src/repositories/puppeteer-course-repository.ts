import type { Event, ICourseRepository, InfoesteEvent } from '@infoeste/core';
import type { Frame } from 'puppeteer';
import type { PuppeteerManager } from '../puppeteer/puppeteer-manager';

export class PuppeteerCourseRepository implements ICourseRepository {
  private readonly URL = 'https://www.unoeste.br/semanas/2025/37infoeste/CursosPalestras';
  constructor(private puppeteerManager: PuppeteerManager) {}

  async getGroupedEvents(): Promise<InfoesteEvent[]> {
    const page = await this.puppeteerManager.navigateTo(this.URL);
    const iframe = await page.waitForSelector('#iframeAtividades', { timeout: 10000 });
    const frame = await iframe?.contentFrame();

    if (!frame) {
      throw new Error('Não foi possível acessar o iframe de cursos');
    }

    await this.selectParticipantCategory(frame);
    const events = await this.extractEvents(frame);
    return events;
  }

  private async selectParticipantCategory(frame: Frame): Promise<void> {
    const categorySelector = '#ddlCat';
    const categoryValue = '4384';
    await frame.waitForSelector(categorySelector, { timeout: 10000 });
    await frame.select(categorySelector, categoryValue);
    await frame.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  }

  private async extractEvents(frame: Frame): Promise<InfoesteEvent[]> {
    await frame.waitForSelector('#listaHorarios', { timeout: 10000 });

    const events = (await frame.evaluate(() => {
      const parsedEvents: InfoesteEvent[] = [];
      const eventElements = document.querySelectorAll('#listaHorarios > li');

      eventElements.forEach(eventElement => {
        const titleElement = eventElement.querySelector('.tituloDoTipo');
        const title = titleElement ? (titleElement.textContent?.trim() ?? '') : '';

        const allRows = eventElement.querySelectorAll('table tbody tr');

        let currentDate = '';
        const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;

        const courses: Event[] = [];
        allRows.forEach(row => {
          // Verifica se a linha é um header de data (contém <th>)
          const headerCell = row.querySelector('th:first-child');
          if (headerCell) {
            const dateMatch = headerCell.textContent?.match(dateRegex);
            if (dateMatch) {
              currentDate = dateMatch[0];
            }
            return; // Pula para a próxima linha (não é um curso)
          }

          // Processa linha de curso (contém <td>)
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
