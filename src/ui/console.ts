import type { ICourseRepository } from "../core/interfaces/course-repository";
import fs from "node:fs";
import path from "node:path";

export class ConsoleUI {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async render(): Promise<void> {
    try {
      console.log("Buscando eventos...");
      const events = await this.courseRepository.getEvents();
      const json = JSON.stringify(events, null, 2);
      console.log("Eventos encontrados:", json);
      const outputPath = path.resolve(process.cwd(), "events.json");
      console.info({ outputPath });
      fs.writeFileSync(outputPath, json, "utf-8");
      console.log(`Eventos salvos em ${outputPath}`);
    } catch (error) {
      console.error("Ocorreu um erro:", error);
    }
  }
}
