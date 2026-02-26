'use client';

import { useState } from 'react';
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
};

const getColor = (p: number) =>
  p < 30 ? 'text-green-600' :
  p < 60 ? 'text-yellow-600' :
  'text-red-600';

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
  title, location, data, additionalInfo, reportType, reportResourceId}: CapacityCardProps) {

  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [capacity, setCapacity] = useState(50);
  const currentTime = getCurrentTimeLabel();

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
          title: `${reportType}:${reportResourceId ?? title}`,
          content: JSON.stringify({
            capacity,
            location: location ?? null,
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

      alert('Report submitted.');
    } catch {
      alert('Could not reach backend.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl text-black font-semibold">{title}</h2>
        </div>

        <div>
          <h2 className="text-xs font-Menlo text-gray-400">{today()}</h2>
        </div>

        {location && (
          <div className="flex items-center text-black text-xl font-semibold">
            <span>{location} 📍</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-56 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" tickFormatter={(value, index) => (index % 2 === 0 ? value : '')} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => (v != null ? `${v}%` : '')} />
            <Line type="monotone" dataKey="capacity" strokeWidth={3} dot={{ r: 4 }} />
            <ReferenceLine
              x={currentTime}
              stroke="red"
              strokeDasharray="3 3"
              label="Now"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Opening Hours */}
      {additionalInfo && (
        <div className="text-sm text-gray-600 mb-4">
          {additionalInfo}
        </div>
      )}

      {/* Report Button */}
      <div className="flex justify-end">
        <button
          onClick={handleReportStatusClick}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
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
        <p className="text-sm text-gray-600">Please sign in to submit a report.</p>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Status"
        onSubmit={handleReportSubmit}
      >
        <p className="text-sm text-gray-600 mb-4">
          Let us know how full {title} feels right now.
        </p>

        <div className="text-center mb-3">
          <span className="text-sm text-black">Current Capacity:</span>
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
          className="w-full h-2 rounded-lg cursor-pointer bg-gray-300"
        />
      </Modal>
    </div>
  );
}
