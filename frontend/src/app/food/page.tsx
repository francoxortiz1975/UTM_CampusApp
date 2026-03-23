'use client'

import AppPageLayout from '../../components/AppPageLayout';
import { useId, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../../components/Modal';
import { Profile } from '../../types/Authentication';
import {
  btnPrimary,
  cardSurface,
  focusRing,
  inputBase,
} from '../../lib/ui-classes';
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

const getWaitColour = (minutes: number) =>
  minutes <= 5 ? 'text-[var(--success)]' :
  minutes <= 10 ? 'text-[var(--warning)]' :
  'text-[var(--danger)]';

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
const FOOD_OVERRIDES_KEY = 'placeholder:foodWaitOverrides';

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
  graph_data,
  onReportSubmitted,
}: {
  data: Restaurant;
  time: number;
  graph_data: {time: string; capacity: number}[];
  onReportSubmitted?: (reportedWait: number) => void;
}) {
  const waitLabelId = useId();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [waitMinutes, setWaitMinutes] = useState(15);

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
    <article className={`${cardSurface} p-6`}>
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-[var(--fg)]">{data.name}</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">{data.building}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-[var(--fg-muted)]">{today}</p>
          <p className={`text-lg font-bold tabular-nums ${getWaitColour(time)}`}>
            About {time} min wait
          </p>
        </div>
      </header>

      <div
        className="mb-4 h-40 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-page)] p-2"
        role="img"
        aria-label={`Wait time trend for ${data.name}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={graph_data}>
            <XAxis dataKey="time" tick={{ fill: 'var(--fg-muted)', fontSize: 11 }} />
            <YAxis
              domain={[0, 60]}
              tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              formatter={(v) => `${v} min`}
              contentStyle={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--fg)',
              }}
            />
            <Line
              type="monotone"
              dataKey="capacity"
              stroke="var(--chart-line)"
              strokeWidth={2}
              dot={{ r: 2, fill: 'var(--chart-line)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="mb-4 flex flex-wrap gap-2" aria-label="Tags">
        {data.tags.map((tag) => (
          <li key={tag}>
            <span className="inline-block rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--fg-muted)]">
              {tag}
            </span>
          </li>
        ))}
      </ul>

      <div className="mb-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--fg-muted)]">
        <p className="mb-2 font-medium text-[var(--fg)]">Opening hours</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          <p>
            Mon–Thu: <span className="font-medium text-[var(--fg)]">{data.hours.monThu}</span>
          </p>
          <p>
            Fri: <span className="font-medium text-[var(--fg)]">{data.hours.fri}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleReportStatusClick} className={btnPrimary}>
          Report wait time
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
        <p className="text-sm text-[var(--fg-muted)]">Please sign in to submit a report.</p>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Food Wait Time"
        onSubmit={handleReportSubmit}
      >
        <p className="mb-4 text-sm text-[var(--fg-muted)]">Let us know how long you waited.</p>

        <div className="space-y-2">
          <div className="mt-3 text-center">
            <span id={waitLabelId} className="text-sm text-[var(--fg)]">
              Estimated wait
            </span>

            <div
              className={`text-2xl font-bold tabular-nums motion-safe:transition-colors ${getWaitColour(
                waitMinutes
              )}`}
              aria-live="polite"
            >
              {waitMinutes} min
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={waitMinutes}
            onChange={(e) => setWaitMinutes(Number(e.target.value))}
            aria-labelledby={waitLabelId}
            aria-valuemin={0}
            aria-valuemax={60}
            aria-valuenow={waitMinutes}
            aria-valuetext={`${waitMinutes} minutes`}
            className={`h-2 w-full cursor-pointer rounded-lg bg-[var(--surface-muted)] accent-[var(--primary)] ${focusRing}`}
          />
        </div>
      </Modal>
    </article>
  );
}

const now = new Date();

async function getReport(res_id: string, time: number): Promise<number> {
  const now = new Date();

  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`${apiBase}/reports/${month}/${weekday}/${time}/food/${res_id}`);
    if (!res.ok) return 10;

    const payload = await res.json();
    const estimate = payload?.estimate;
    return typeof estimate === 'number' ? estimate : 10;
  } catch {
    return 10;
  }
}

async function getFullDayReport(location: string): Promise<{ time: string; capacity: number }[]> {
  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`${apiBase}/reports/${month}/${weekday}/food/${location}`);

    const payload = await res.json();
    return payload;
  } catch {
    console.log("Failed to Fetch");
    return []
  }
}

export default function FoodCourtPage() {
  const searchId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<{ time: string; capacity: number }[]>([]);

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

  async function loadEstimates() {

      const time = now.getHours();
      const results = await Promise.all(
        RESTAURANTS.map(async (loc) => ({
          name: loc.name,
          estimate: await getReport(loc.id, time)
        }))
      );

      const mapped: Record<string, number> = {};
      results.forEach(r => {
        mapped[r.name] = r.estimate;
      });

      setEstimates(mapped);
      console.log("Mapped Estimates:", mapped);
      return mapped;
    }

  useEffect(() => {
    loadEstimates();
  }, []);

  return (
    <AppPageLayout
      title="Campus food"
      description="Search and filter venues, then open one to see wait trends and report your experience."
      contentMax="sm"
    >
      <div className="space-y-8">
        {selectedRestaurant && (
          <FoodCard 
            data={selectedRestaurant} 
            time={selectedTime ?? selectedRestaurant.waitTime}
            graph_data={graphData}
            onReportSubmitted={async () => {
              const newEstimates = await loadEstimates();

              if (selectedId) {
                const data = await getFullDayReport(selectedId);
                setGraphData(data);

                const restaurant = RESTAURANTS.find(r => r.id === selectedId);
                if (restaurant) {
                  setSelectedTime(newEstimates[restaurant.name]);
                }
              }
            }}
          />
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          <div className={`${cardSurface} space-y-5 p-5 md:sticky md:top-20 md:self-start`}>
            <div>
              <label htmlFor={searchId} className="mb-2 block text-sm font-semibold text-[var(--fg)]">
                Search restaurants
              </label>
              <input
                id={searchId}
                type="search"
                placeholder="Search by name…"
                className={inputBase}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>

            <fieldset className="min-w-0 border-0 p-0">
              <legend className="mb-2 text-sm font-semibold text-[var(--fg)]">Filters</legend>
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1 sm:max-h-none">
                <button
                  type="button"
                  aria-pressed={activeFilter === null}
                  onClick={() => setActiveFilter(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium motion-safe:transition-colors ${
                    activeFilter === null
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-fg)]'
                      : 'border-[var(--border)] bg-[var(--surface-card)] text-[var(--fg-muted)] hover:border-[var(--primary)]'
                  } ${focusRing}`}
                >
                  All
                </button>
                {filters.map((filter) => {
                  const on = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setActiveFilter(filter === activeFilter ? null : filter)}
                      className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs font-medium motion-safe:transition-colors ${
                        on
                          ? 'border-[var(--primary)] bg-[var(--surface-muted)] text-[var(--fg)]'
                          : 'border-[var(--border)] bg-[var(--surface-card)] text-[var(--fg-muted)] hover:border-[var(--primary)]'
                      } ${focusRing}`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-[var(--fg)]">Wait times</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Sorted shortest first. Open a venue for the chart and to report wait time.
            </p>
            <div className={`${cardSurface} mt-4 overflow-hidden p-0`}>
              <ul className="divide-y divide-[var(--border)]">
                {filteredList.map((item) => {
                  const time = estimates[item.name] ?? item.waitTime;
                  const current = selectedId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-pressed={current}
                        onClick={async () => {
                          setSelectedId(item.id);
                          setSelectedTime(time);
                          const data = await getFullDayReport(item.id);
                          setGraphData(data);
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left motion-safe:transition-colors sm:px-6 ${
                          current ? 'bg-[var(--surface-muted)]' : 'hover:bg-[var(--surface-muted)]/70'
                        } ${focusRing}`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--fg)]">{item.name}</p>
                          <p className="text-xs text-[var(--fg-muted)]">{item.building}</p>
                        </div>

                        <span className={`shrink-0 text-sm font-bold tabular-nums ${getWaitColour(time)}`}>
                          {time} min
                        </span>
                      </button>
                    </li>
                  );
                })}

                {filteredList.length === 0 && (
                  <li className="p-6 text-center text-[var(--fg-muted)]">
                    No restaurants match your filters.
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </AppPageLayout>
  );
}
