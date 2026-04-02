export interface CampusEvent {
  id: string;
  title: string;
  club: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}

export const MOCK_EVENTS: CampusEvent[] = [
  {
    id: '1',
    title: 'CS Club Meeting',
    club: 'CS Club',
    date: '2026-03-25',
    startTime: '18:00',
    endTime: '19:30',
    location: 'BA 1170',
    description: 'Weekly general meeting',
  },
  {
    id: '2',
    title: 'Hackathon Workshop',
    club: 'Tech Society',
    date: '2026-03-27',
    startTime: '14:00',
    endTime: '17:00',
    location: 'BA 2135',
    description: 'Learn React',
  },
  {
    id: '3',
    title: 'Study Session',
    club: 'Math Society',
    date: '2026-03-28',
    startTime: '16:00',
    endTime: '18:00',
    location: 'Library',
    description: 'MAT157 study group',
  },
];
