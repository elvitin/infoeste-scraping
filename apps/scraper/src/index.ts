import { PuppeteerCourseRepository } from "@infoeste/infrastructure";
import { ConsoleUI } from "./ui/console";

async function main(): Promise<void> {
  const courseRepository = new PuppeteerCourseRepository();
  const ui = new ConsoleUI(courseRepository);
  await ui.render();
}

main().catch((error) => {
  console.error("Falha ao executar o coletor:", error);
  process.exitCode = 1;
});
