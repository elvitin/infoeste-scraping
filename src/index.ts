import { PuppeteerCourseRepository } from "./infrastructure/puppeteer-course-repository";
import { ConsoleUI } from "./ui/console";

async function main() {
	const courseRepository = new PuppeteerCourseRepository();
	const ui = new ConsoleUI(courseRepository);
	await ui.render();
}

main();
