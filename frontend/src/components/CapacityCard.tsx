'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import { Profile } from '../types/Authentication';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type DataPoint = {
  time: string;
  capacity: number;
};

type CapacityCardProps = {
  title: string;
  location?: string;
  data: DataPoint[];
  openingHours?: React.ReactNode;
  additionalInfo?: React.ReactNode;
  reportType?: 'gym' | 'parking';
  reportResourceId?: string;
  onReportSubmitted?: (reportedCapacity: number) => void;
};

const getColor = (p: number) =>
  p < 30 ? 'text-green-600 dark:text-green-400' :
  p < 60 ? 'text-yellow-600 dark:text-yellow-400' :
  'text-red-600 dark:text-red-400';

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const getCurrentTimeLabel = () => {
  const now = new Date();
  let hour = now.getHours();
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour} ${suffix}`;
};

const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5001'
    : 'http://localhost:5001';

export default function CapacityCard({
  title, location, data, additionalInfo, reportType, reportResourceId, onReportSubmitted}: CapacityCardProps) {

  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [capacity, setCapacity] = useState(50);
  const [chartData, setChartData] = useState<DataPoint[]>(data);
  const currentTime = getCurrentTimeLabel();

  useEffect(() => {
    setChartData(data);
  }, [data]);

  const handleReportStatusClick = async () => {
    const user = await Profile();
    if (user == null) {
      setIsSignInModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleReportSubmit = async () => {
    const user = await Profile();
    if (user == null) {
      setIsModalOpen(false);
      setIsSignInModalOpen(true);
      return;
    }

    if (!reportType) {
      alert('Reporting is not configured for this card.');
      return;
    }

    try {
      const result = await fetch(`${apiBase}/reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: user.id,
          title: `${reportType}`,
          content: JSON.stringify({
            capacity,
            location: `${reportResourceId ?? title}`,
            reported_at: new Date().toISOString(),
          }),
        }),
      });

      if (!result.ok) {
        if (result.status === 401) {
          alert('Please sign in to submit a report.');
          setIsModalOpen(false);
          setIsSignInModalOpen(true);
          return;
        }
        alert('Could not submit report right now.');
        return;
      }

      setChartData((prev) => {
        const base = prev.length ? prev : [{ time: currentTime, capacity }];
        const updated = [...base];
        updated[updated.length - 1] = { ...updated[updated.length - 1], capacity };
        return updated;
      });
      onReportSubmitted?.(capacity);
      alert('Report submitted.');
    } catch {
      alert('Could not reach backend.');
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow dark:bg-zinc-900 dark:shadow-zinc-950/50">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-zinc-100">{title}</h2>
        </div>

        <div>
          <h2 className="font-Menlo text-xs text-gray-400 dark:text-zinc-500">{today()}</h2>
        </div>

        {location && (
          <div className="flex items-center text-xl font-semibold text-black dark:text-zinc-100">
            <span>{location} 📍</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mb-6 h-56 w-full text-indigo-600 dark:text-indigo-400">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value, index) => (index % 2 === 0 ? value : '')}
            />
            <YAxis domain={[0, 100]} tick={{ fill: 'currentColor' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v) => (v != null ? `${v}%` : '')}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid rgba(128, 128, 128, 0.35)',
                borderRadius: '0.5rem',
                color: 'var(--foreground)',
              }}
            />
            <Line type="monotone" dataKey="capacity" stroke="currentColor" strokeWidth={3} dot={{ r: 4 }} />
            <ReferenceLine
              x={currentTime}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label="Now"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Opening Hours */}
      {additionalInfo && (
        <div className="mb-4 text-sm text-gray-600 dark:text-zinc-400">
          {additionalInfo}
        </div>
      )}

      {/* Report Button */}
      <div className="flex justify-end">
        <button
          onClick={handleReportStatusClick}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
        >
          ▶ Report Status
        </button>
      </div>

      {/* Sign-in required pop-up */}
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
        <p className="text-sm text-gray-600 dark:text-zinc-400">Please sign in to submit a report.</p>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Status"
        onSubmit={handleReportSubmit}
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-zinc-400">
          Let us know how full {title} feels right now.
        </p>

        <div className="mb-3 text-center">
          <span className="text-sm text-black dark:text-zinc-200">Current Capacity:</span>
          <div className={`text-2xl font-bold ${getColor(capacity)}`}>
            {capacity}%
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          className="h-2 w-full cursor-pointer rounded-lg bg-gray-300 dark:bg-zinc-600"
        />
      </Modal>
    </div>
  );
}
