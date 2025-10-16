import type { Browser, Frame, Page } from "puppeteer";
import puppeteer from "puppeteer";
import type { ICourseRepository } from "../core/interfaces/course-repository";
import type { Event } from "../core/entities/event";
import type { Course } from "../core/entities/course";

export class PuppeteerCourseRepository implements ICourseRepository {
  private readonly URL = "https://www.unoeste.br/semanas/2025/37infoeste/CursosPalestras";

  async getEvents(): Promise<Event[]> {
    const browser = await this.launchBrowser();
    const page = await this.newPage(browser);

    try {
      await this.navigateToPage(page);
      const iframe = await page.waitForSelector("#iframeAtividades");
      const frame = await iframe?.contentFrame();
      if (!frame) {
        throw new Error("Não foi possível acessar o iframe de cursos");
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
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
    });
  }

  private async newPage(browser: Browser): Promise<Page> {
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.setViewport(null);
    return page;
  }

  private async navigateToPage(page: Page): Promise<void> {
    await page.goto(this.URL, { waitUntil: "networkidle2" });
  }

  private async selectParticipantCategory(frame: Frame): Promise<void> {
    const categorySelector = "#ddlCat";
    const categoryValue = "4384";
    await frame.waitForSelector(categorySelector);
    await frame.select(categorySelector, categoryValue);
    await frame.waitForNavigation({ waitUntil: "networkidle2" });
  }

  private async extractEvents(frame: Frame): Promise<Event[]> {
    await frame.waitForSelector("#listaHorarios");
    return frame.evaluate(() => {
      const events: Event[] = [];
      const eventElements = document.querySelectorAll("#listaHorarios > li");

      eventElements.forEach((eventElement) => {
        const titleElement = eventElement.querySelector(".tituloDoTipo");
        const title = titleElement ? (titleElement.textContent?.trim() ?? "") : "";

        const courseRows = eventElement.querySelectorAll("table tbody tr:not(:first-child)");
        let currentDate = "";

        const dateHeader = eventElement.querySelector("table tbody tr:first-child th:first-child");
        if (dateHeader) {
          const dateMatch = dateHeader.textContent?.match(/(\d{2}\/\d{2}\/\d{4})/);
          if (dateMatch) {
            currentDate = dateMatch[0];
          }
        }

        const courses: Course[] = [];
        courseRows.forEach((row) => {
          const columns = row.querySelectorAll("td");
          if (columns.length >= 4) {
            const courseNameElement = columns[0].querySelector("a");
            const courseName = courseNameElement ? (courseNameElement.textContent?.trim() ?? "") : "";
            const idMatch = courseName.match(/\( (\d+) \)/);
            const id = idMatch ? parseInt(idMatch[1], 10) : 0;

            const time = columns[1].textContent?.trim() ?? "";
            const vacancies = parseInt(columns[2].textContent?.trim() ?? "0", 10);
            const vacanciesLeft = parseInt(columns[3].textContent?.trim() ?? "0", 10);

            courses.push({
              id,
              name: courseName.replace(`( ${id} ) - `, ""),
              time,
              vacancies,
              vacanciesLeft,
            });
          }
        });

        if (title && courses.length > 0) {
          events.push({
            title,
            date: currentDate,
            courses,
          });
        }
      });

      return events;
    });
  }
}
