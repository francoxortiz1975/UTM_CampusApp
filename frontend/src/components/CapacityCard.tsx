'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import Modal from './Modal';
import { Profile } from '../types/Authentication';
import { btnPrimary, cardSurface, focusRing } from '../lib/ui-classes';
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
  p < 30 ? 'text-[var(--success)]' : p < 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]';

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
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000';

export default function CapacityCard({
  title, location, data, additionalInfo, reportType, reportResourceId, onReportSubmitted}: CapacityCardProps) {

  const capacityLabelId = useId();
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

  const latest =
    chartData.length > 0 ? chartData[chartData.length - 1]?.capacity : undefined;

  return (
    <article className={`${cardSurface} p-6`}>
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[var(--fg)]">{title}</h2>
          {location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--fg-muted)]">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span>{location}</span>
            </p>
          )}
        </div>
        <p className="text-xs tabular-nums text-[var(--fg-muted)]">{today()}</p>
      </header>

      <div
        className="mb-6 h-56 w-full"
        role="img"
        aria-label={
          typeof latest === 'number'
            ? `Occupancy trend chart. Latest value about ${latest} percent.`
            : 'Occupancy trend chart.'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--fg-muted)', fontSize: 12 }}
              tickFormatter={(value, index) => (index % 2 === 0 ? value : '')}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--fg-muted)', fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(v) => (v != null ? `${v}%` : '')}
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
              dot={{ r: 3, fill: 'var(--chart-line)' }}
            />
            <ReferenceLine
              x={currentTime}
              stroke="var(--danger)"
              strokeDasharray="3 3"
              label="Now"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Opening Hours */}
      {additionalInfo && (
        <div className="mb-4 text-sm text-[var(--fg-muted)]">{additionalInfo}</div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={handleReportStatusClick} className={btnPrimary}>
          Report status
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
        <p className="text-sm text-[var(--fg-muted)]">Please sign in to submit a report.</p>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Status"
        onSubmit={handleReportSubmit}
      >
        <p className="mb-4 text-sm text-[var(--fg-muted)]">
          Let us know how full {title} feels right now.
        </p>

        <div className="mb-3 text-center">
          <span id={capacityLabelId} className="text-sm text-[var(--fg)]">
            Current capacity
          </span>
          <div className={`text-2xl font-bold tabular-nums ${getColor(capacity)}`} aria-live="polite">
            {capacity}%
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          aria-labelledby={capacityLabelId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={capacity}
          aria-valuetext={`${capacity} percent full`}
          className={`h-2 w-full cursor-pointer rounded-lg bg-[var(--surface-muted)] accent-[var(--primary)] ${focusRing}`}
        />
      </Modal>
    </article>
  );
}
