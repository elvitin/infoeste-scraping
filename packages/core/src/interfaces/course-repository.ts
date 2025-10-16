import type { InfoesteEvent } from '../entities/infoeste-event';

export interface ICourseRepository {
  getGroupedEvents(): Promise<InfoesteEvent[]>;
}
