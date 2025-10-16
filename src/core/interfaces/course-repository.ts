import type { Event } from "../entities/event";

export interface ICourseRepository {
	getEvents(): Promise<Event[]>;
}
