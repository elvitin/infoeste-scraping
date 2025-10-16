import type { Course } from "./course";

export interface Event {
	title: string;
	date: string;
	courses: Course[];
}
