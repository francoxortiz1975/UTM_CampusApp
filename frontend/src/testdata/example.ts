type WeeklyPoint = { day: string; weekday: number; weekend: number };

type VenueData = {
  name: string;
  location: string;
  capacity: number;
  isOpen: boolean;
  waitTime: string;
  openingHours: string;
  color: string;
  weeklyData: WeeklyPoint[];
};

// Mock data for gyms
export const gymData: VenueData[] = [
  {
    name: 'RAWC Gym',
    location: 'Recreation, Athletics & Wellness Centre',
    capacity: 68,
    isOpen: true,
    waitTime: '5-10 min',
    openingHours: 'Mon-Fri: 6:00 AM - 11:00 PM | Sat-Sun: 8:00 AM - 9:00 PM',
    color: '#3b82f6',
    weeklyData: [
      { day: 'Mon', weekday: 75, weekend: 0 },
      { day: 'Tue', weekday: 72, weekend: 0 },
      { day: 'Wed', weekday: 80, weekend: 0 },
      { day: 'Thu', weekday: 78, weekend: 0 },
      { day: 'Fri', weekday: 65, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 55 },
      { day: 'Sun', weekday: 0, weekend: 48 },
    ],
  },
  {
    name: 'Fitness Centre',
    location: 'Davis Building',
    capacity: 42,
    isOpen: true,
    waitTime: '0-5 min',
    openingHours: 'Mon-Fri: 7:00 AM - 10:00 PM | Sat-Sun: 9:00 AM - 8:00 PM',
    color: '#10b981',
    weeklyData: [
      { day: 'Mon', weekday: 55, weekend: 0 },
      { day: 'Tue', weekday: 48, weekend: 0 },
      { day: 'Wed', weekday: 52, weekend: 0 },
      { day: 'Thu', weekday: 50, weekend: 0 },
      { day: 'Fri', weekday: 40, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 35 },
      { day: 'Sun', weekday: 0, weekend: 30 },
    ],
  },
];

// Mock data for food venues
export const foodData: VenueData[] = [
  {
    name: 'The Blind Duck Pub',
    location: 'Student Centre',
    capacity: 82,
    isOpen: true,
    waitTime: '10-15 min',
    openingHours: 'Mon-Fri: 11:00 AM - 9:00 PM | Sat-Sun: Closed',
    color: '#f59e0b',
    weeklyData: [
      { day: 'Mon', weekday: 70, weekend: 0 },
      { day: 'Tue', weekday: 75, weekend: 0 },
      { day: 'Wed', weekday: 85, weekend: 0 },
      { day: 'Thu', weekday: 88, weekend: 0 },
      { day: 'Fri', weekday: 92, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 0 },
      { day: 'Sun', weekday: 0, weekend: 0 },
    ],
  },
  {
    name: 'Tim Hortons',
    location: 'Davis Building',
    capacity: 65,
    isOpen: true,
    waitTime: '5-8 min',
    openingHours: 'Mon-Fri: 7:00 AM - 8:00 PM | Sat-Sun: 9:00 AM - 6:00 PM',
    color: '#ef4444',
    weeklyData: [
      { day: 'Mon', weekday: 80, weekend: 0 },
      { day: 'Tue', weekday: 78, weekend: 0 },
      { day: 'Wed', weekday: 82, weekend: 0 },
      { day: 'Thu', weekday: 75, weekend: 0 },
      { day: 'Fri', weekday: 70, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 45 },
      { day: 'Sun', weekday: 0, weekend: 40 },
    ],
  },
  {
    name: 'Colman Commons Cafeteria',
    location: 'South Building',
    capacity: 55,
    isOpen: true,
    waitTime: '8-12 min',
    openingHours: 'Mon-Fri: 8:00 AM - 7:00 PM | Sat-Sun: Closed',
    color: '#8b5cf6',
    weeklyData: [
      { day: 'Mon', weekday: 68, weekend: 0 },
      { day: 'Tue', weekday: 72, weekend: 0 },
      { day: 'Wed', weekday: 75, weekend: 0 },
      { day: 'Thu', weekday: 70, weekend: 0 },
      { day: 'Fri', weekday: 58, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 0 },
      { day: 'Sun', weekday: 0, weekend: 0 },
    ],
  },
];

// Mock data for parking
export const parkingData: VenueData[] = [
  {
    name: 'North Parking Lot',
    location: 'North of Campus',
    capacity: 88,
    isOpen: true,
    waitTime: '15-20 min',
    openingHours: 'Open 24/7',
    color: '#6366f1',
    weeklyData: [
      { day: 'Mon', weekday: 92, weekend: 0 },
      { day: 'Tue', weekday: 95, weekend: 0 },
      { day: 'Wed', weekday: 98, weekend: 0 },
      { day: 'Thu', weekday: 94, weekend: 0 },
      { day: 'Fri', weekday: 85, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 45 },
      { day: 'Sun', weekday: 0, weekend: 38 },
    ],
  },
  {
    name: 'South Parking Lot',
    location: 'South Building Area',
    capacity: 72,
    isOpen: true,
    waitTime: '8-12 min',
    openingHours: 'Open 24/7',
    color: '#14b8a6',
    weeklyData: [
      { day: 'Mon', weekday: 85, weekend: 0 },
      { day: 'Tue', weekday: 88, weekend: 0 },
      { day: 'Wed', weekday: 90, weekend: 0 },
      { day: 'Thu', weekday: 87, weekend: 0 },
      { day: 'Fri', weekday: 75, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 35 },
      { day: 'Sun', weekday: 0, weekend: 30 },
    ],
  },
  {
    name: 'Visitor Parking',
    location: 'Near Main Entrance',
    capacity: 45,
    isOpen: true,
    waitTime: '3-5 min',
    openingHours: 'Open 24/7',
    color: '#ec4899',
    weeklyData: [
      { day: 'Mon', weekday: 55, weekend: 0 },
      { day: 'Tue', weekday: 60, weekend: 0 },
      { day: 'Wed', weekday: 65, weekend: 0 },
      { day: 'Thu', weekday: 58, weekend: 0 },
      { day: 'Fri', weekday: 48, weekend: 0 },
      { day: 'Sat', weekday: 0, weekend: 25 },
      { day: 'Sun', weekday: 0, weekend: 20 },
    ],
  },
];
