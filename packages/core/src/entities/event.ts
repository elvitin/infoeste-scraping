export interface Event {
  id: number;
  name: string;
  date: string; //like: 31/10/2025 with startTime
  periodTime: string; //like: 19:00 às 22:30
  startTime: string; //like: 19:00
  endTime: string; //like: 22:30
  vacancies: number;
  vacanciesLeft: number;
}
