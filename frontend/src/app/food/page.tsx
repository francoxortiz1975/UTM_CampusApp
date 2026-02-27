'use client'

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../../components/Modal';
import { Profile } from '../../types/Authentication';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Restaurant {
  id: string;
  name: string;
  building: string;
  waitTime: number; // In minutes
  tags: string[];
  hours: {
    monThu: string;
    fri: string;
  };
  imagePlaceholderColor: string; // Using color for now, can replace with images later
}

const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Subway',
    building: 'Instructional Building (IB)',
    waitTime: 1,
    tags: ['Sandwiches', 'Fresh', 'Healthy'],
    hours: { monThu: '10am - 9:30pm', fri: '10:30am - 6pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '2',
    name: 'Harvey\'s',
    building: 'William G. Davis Building (DV)',
    waitTime: 7,
    tags: ['Burgers', 'Poutine', 'Grill', 'Fast Food'],
    hours: { monThu: '10:30am - 9pm', fri: '10:30am - 4pm' },
    imagePlaceholderColor: 'bg-red-200'
  },
  {
    id: '3',
    name: 'Starbucks',
    building: 'Deerfield Hall (DH)',
    waitTime: 11,
    tags: ['Coffee', 'Espresso', 'Bakery', 'Breakfast'],
    hours: { monThu: '8am - 7pm', fri: '8am - 4pm' },
    imagePlaceholderColor: 'bg-green-200'
  },
  {
    id: '4',
    name: 'Second Cup Café',
    building: 'Kaneff Centre (KN)',
    waitTime: 3,
    tags: ['Coffee', 'Tea', 'Pastries', 'Snacks'],
    hours: { monThu: '8:30am - 5pm', fri: '8:30am - 3pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '5',
    name: 'Flex Bowl',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 7pm', fri: '11am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '6',
    name: 'Tex Mex Grill',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 7pm', fri: '11am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '7',
    name: 'Fresh Baked out of the Oven',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 9pm', fri: '10:30am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '8',
    name: 'FUSION8',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 7pm', fri: '11am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '9',
    name: 'Chef\'s Table',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '8am - 6pm', fri: '8am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '10',
    name: 'Thai Express',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 7pm', fri: '10:30am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '11',
    name: 'Shawarma Rotisserie',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 7pm', fri: '11am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '12',
    name: 'CRISP Fresh Salads',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 7pm', fri: '11am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '13',
    name: 'SAMMIES',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 7pm', fri: '11am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '14',
    name: 'UTM Smoked Meat',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 7pm', fri: '11am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '15',
    name: 'Baked',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '8am - 6pm', fri: '8am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '16',
    name: 'Roasted & Steeped',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '8am - 6pm', fri: '8am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '17',
    name: 'BODEGA',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '8am - 6pm', fri: '8am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '18',
    name: 'Kettle Meal',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 8:30pm', fri: '11am - 3:30pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '19',
    name: 'Ah-So Sushi',
    building: 'William G. Davis Building (DV)',
    waitTime: 3,
    tags: ['Placeholder'],
    hours: { monThu: '8am - 6pm', fri: '8am - 4pm' },
    imagePlaceholderColor: 'bg-yellow-100'
  },
  {
    id: '20',
    name: 'EuroBowl',
    building: 'Deerfield Hall (DH)',
    waitTime: 11,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 4pm', fri: '11am - 3pm' },
    imagePlaceholderColor: 'bg-green-200'
  },
  {
    id: '21',
    name: 'European Sandwich',
    building: 'Deerfield Hall (DH)',
    waitTime: 11,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 4pm', fri: '11am - 3pm' },
    imagePlaceholderColor: 'bg-green-200'
  },
  {
    id: '22',
    name: 'Fresh Baked out of the Oven',
    building: 'Deerfield Hall (DH)',
    waitTime: 11,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 6pm', fri: '10:30am - 2pm' },
    imagePlaceholderColor: 'bg-green-200'
  },
  {
    id: '23',
    name: 'Baked',
    building: 'Deerfield Hall (DH)',
    waitTime: 11,
    tags: ['Placeholder'],
    hours: { monThu: '8:30am - 6pm', fri: '8:30am - 3pm' },
    imagePlaceholderColor: 'bg-green-200'
  },
  {
    id: '24',
    name: 'Kettle Meal',
    building: 'Deerfield Hall (DH)',
    waitTime: 11,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 5pm', fri: '10:30am - 2pm' },
    imagePlaceholderColor: 'bg-green-200'
  },
  {
    id: '25',
    name: 'Quesada',
    building: 'Instructional Building (IB)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '10am - 9:30pm', fri: '10:30am - 6pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '26',
    name: 'Ah-So Sushi',
    building: 'Instructional Building (IB)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 6pm', fri: '10:30am - 6pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  // FIX THE OPH ENTRIES (MORE FLEXIBILITY IN DATES)
  {
    id: '27',
    name: 'Grill over the Fire',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '7:30am - 12am', fri: '7:30am - 9pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '28',
    name: 'Chef\'s Table',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '11:30am - 9am', fri: '11am - 8:30pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '29',
    name: 'Fresh Baked out of the Oven',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 10pm', fri: '12:30pm - 7pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '30',
    name: 'Kettle Meal',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 9pm', fri: '12:30pm - 6pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '31',
    name: 'Sammies',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 10pm', fri: '12:30pm - 7pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '32',
    name: 'CRISP Fresh Salads',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '10:30am - 7pm', fri: '12:30pm - 6pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '33',
    name: 'POP UP',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '1pm - 8pm', fri: '1pm - 8pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '34',
    name: 'FLEX BOWL',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '11am - 9pm', fri: 'Closed' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '35',
    name: 'The Smoothie Bar',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '7:30am - 9pm', fri: '7:30am-6pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '36',
    name: 'Baked',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '7:30am - 12am', fri: '7:30am-9pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '37',
    name: 'BODEGA',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '7:30am - 12am', fri: '7:30am-9pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '38',
    name: 'Oscar Café',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '8pm - 12am', fri: 'Closed' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '39',
    name: 'C Store',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '7:30am - 12am', fri: '7:30am-9pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '40',
    name: 'Roasted and Steeped',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '7:30am - 12am', fri: '7:30am-9pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '41',
    name: 'Ah-So Sushi',
    building: 'Oscar Peterson Hall (OPH)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '7:30am - 12am', fri: '7:30am-9pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '42',
    name: 'Fair Trade Cafe',
    building: 'Maanjiwe Nendamowinan (MN)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '9am-4pm', fri: '9am-3pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
  {
    id: '43',
    name: 'Circuit Break Cafe',
    building: 'Communication, Culture & Technology building (CCT)',
    waitTime: 1,
    tags: ['Placeholder'],
    hours: { monThu: '8am-4pm', fri: '8am-2pm' },
    imagePlaceholderColor: 'bg-orange-200'
  },
];

// --- Helpers ---

// Colour logic for wait times (Green < 5m, Yellow < 10m, Red > 10m)
const getWaitColour = (minutes: number) =>
  minutes <= 5 ? 'text-green-600' :
  minutes <= 10 ? 'text-yellow-600' :
  'text-red-600';

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000';

function buildFoodTrendData(current: number): { time: string; wait: number }[] {
  const cap = (value: number) => Math.max(0, Math.min(60, value));
  const anchors = [
    ['9 AM', cap(current - 6)],
    ['10 AM', cap(current - 3)],
    ['11 AM', cap(current + 1)],
    ['12 PM', cap(current + 4)],
    ['1 PM', cap(current + 2)],
    ['2 PM', cap(current)],
    ['3 PM', cap(current - 2)],
    ['4 PM', cap(current + 1)],
  ] as const;

  return anchors.map(([time, wait]) => ({ time, wait }));
}

// --- Components ---

function FoodCard({
  data,
  time,
  onReportSubmitted,
}: {
  data: Restaurant;
  time: number;
  onReportSubmitted?: (reportedWait: number) => void;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [waitMinutes, setWaitMinutes] = useState(15);
  const trendData = buildFoodTrendData(time);

  const handleReportSubmit = async () => {
    const user = await Profile();
    if (user == null) {
      setIsModalOpen(false);
      setIsSignInModalOpen(true);
      return;
    }

    try {
      const result = await fetch(`${apiBase}/reports/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: user.id,
          title: `food:${data.id}`,
          content: JSON.stringify({
            wait_minutes: waitMinutes,
            restaurant_name: data.name,
            restaurant_id: data.id,
            reported_at: new Date().toISOString(),
          }),
        }),
      });

      if (!result.ok) {
        if (result.status === 401) {
          alert("Please sign in to submit a report.");
          return;
        }
        alert("Could not submit report right now.");
        return;
      }

      onReportSubmitted?.(waitMinutes);
      alert("Report submitted.");
    } catch {
      alert("Could not reach backend.");
    }
  };

  const handleReportStatusClick = async () => {
    const user = await Profile();
    if (user == null) {
      setIsSignInModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{data.name}</h2>
          <div className="flex items-center text-gray-500 text-sm mt-1">
            <span className="font-medium mr-2">{data.building}</span>
            <span>📍</span>
          </div>
        </div>
        <div className="text-right">
             <h2 className="text-xs text-gray-400">{today}</h2>
             <p className={`text-lg font-bold ${getWaitColour(time)}`}>
               ~{time} min wait
             </p>
        </div>
      </div>

      {/* Placeholder trend graph (will be replaced by backend-driven values in later sprint) */}
      <div className="w-full h-40 rounded-lg mb-4 bg-gray-50 border border-gray-200 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <XAxis dataKey="time" />
            <YAxis domain={[0, 60]} tickFormatter={(v) => `${v}m`} />
            <Tooltip formatter={(v) => `${v} min`} />
            <Line type="monotone" dataKey="wait" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* Opening Hours */}
      <div className="text-sm text-gray-600 mb-4 border-t pt-4">
        <p className="font-medium text-gray-700 mb-1">Opening Hours:</p>
        <div className="grid grid-cols-2 gap-4">
          <p>Mon - Thu: <span className="font-medium">{data.hours.monThu}</span></p>
          <p>Fri: <span className="font-medium">{data.hours.fri}</span></p>
        </div>
      </div>

      {/* Report Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleReportStatusClick}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
          ▶ Report Status
        </button>
      </div>

      <Modal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        title="Sign in required"
        primaryButtonText="Sign In"
        primaryButtonOnClick={() => {
          setIsSignInModalOpen(false);
          router.push('/signin');
        }}
      >
        <p className="text-sm text-gray-600">Please sign in to submit a report.</p>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Food Wait Time"
        onSubmit={handleReportSubmit}
      >
        <p className="text-sm text-gray-600 mb-4">
          Let us know how long you waited.
        </p>

        <div className="space-y-2">
          <div className="mt-3 text-center">
            <span className="text-sm text-black">Estimated Wait:</span>

            <div
              className={`text-2xl font-bold transition-colors duration-200 ${getWaitColour(
                waitMinutes
              )}`}
            >
              {waitMinutes} mins
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={waitMinutes}
            onChange={(e) => setWaitMinutes(Number(e.target.value))}
            className={`
              w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-300
              ${getWaitColour(waitMinutes)}
            `}
          />
        </div>


      </Modal>
    </div>
  );
}

const now = new Date();

async function getReport(location: string, time: number): Promise<number> {
  const now = new Date();

  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`${apiBase}/reports/${month}/${weekday}/${time}/food/${location}`);
    if (!res.ok) return 10;

    const payload = await res.json();
    const estimate = payload?.estimate;
    return typeof estimate === 'number' ? estimate : 10;
  } catch {
    return 10;
  }
}

export default function FoodCourtPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  const selectedRestaurant = RESTAURANTS.find(r => r.id === selectedId);

  // Filter Logic
  const allTags = Array.from(new Set(RESTAURANTS.flatMap(r => r.tags)));
  const allBuildings = Array.from(new Set(RESTAURANTS.map(r => r.building)));
  const filters = [...allBuildings, ...allTags];

  const filteredList = RESTAURANTS
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter 
        ? (r.building === activeFilter || r.tags.includes(activeFilter))
        : true;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.waitTime - b.waitTime); // Sort by fastest time


  useEffect(() => {
    async function loadEstimates() {
      const locations = [
        { key: 'subway', name: RESTAURANTS[0].name },
        { key: 'second', name: RESTAURANTS[3].name },
        { key: 'harveys', name: RESTAURANTS[1].name },
        { key: 'starbucks', name: RESTAURANTS[2].name }
      ];

      const time = now.getHours();
      const results = await Promise.all(
        locations.map(async (loc) => ({
          name: loc.name,
          estimate: await getReport(loc.key, time)
        }))
      );

      const mapped: Record<string, number> = {};
      results.forEach(r => {
        mapped[r.name] = r.estimate;
      });

      setEstimates(mapped);
      console.log("Mapped Estimates:", mapped);
    }

    loadEstimates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-800">Campus Food</h1>

        {/* Selected Card (Popup/Detail View) */}
        {selectedRestaurant && (
          <FoodCard 
            data={selectedRestaurant} 
            time={selectedTime ?? selectedRestaurant.waitTime}
            onReportSubmitted={(reportedWait) => {
              setSelectedTime(reportedWait);
              setEstimates((prev) => ({
                ...prev,
                [selectedRestaurant.name]: reportedWait,
              }));
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Search & Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div>
               <h3 className="text-sm font-bold text-gray-700 mb-2">Restaurant Search:</h3>
               <div className="relative">
                 <input 
                   type="text" 
                   placeholder="Hinted search text..." 
                   className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-purple-500 placeholder-gray-500 text-gray-900"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
               </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Filters:</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveFilter(null)}
                  className={`px-3 py-1 text-xs rounded-full border transition ${
                    activeFilter === null ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  All
                </button>
                {filters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter === activeFilter ? null : filter)}
                    className={`px-3 py-1 text-xs rounded-full border transition ${
                      activeFilter === filter 
                        ? 'bg-purple-100 text-purple-800 border-purple-300' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Estimated Waiting Times List */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Estimated Waiting Times:</h3>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {filteredList.map((item) => {
                  const time = estimates[item.name] ?? item.waitTime;
                  return(
                    <li key={item.id}>
                      <button 
                        onClick={async() => {
                          setSelectedId(item.id)
                          setSelectedTime(time);
                        }}
                        className={`w-full flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition text-left ${
                          selectedId === item.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xl">✪</span> {/* Placeholder Icon */}
                          <div>
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.building}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getWaitColour(time)}`}>
                            {`${time} Minutes 🕒`}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
                
                {filteredList.length === 0 && (
                  <li className="p-6 text-center text-gray-500">
                    No restaurants match your filters.
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
