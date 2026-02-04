'use client'

import Header from '../../components/Header';
import { useState } from 'react';

const getColor = (p: number) =>
  p < 30 ? 'text-green-600' :
  p < 60 ? 'text-yellow-600' :
  'text-red-600';

const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

function GymCard({ gym }: {gym: string}){
  if (!gym) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">{gym}</h2>
            </div>

            <div>
              <h2 className="text-xs font-Menlo text-gray-400">{today}</h2>
            </div>

            <div className="flex items-center space-x-2 text-xl font-semibold">
              <span>RAWC</span>
              <span className="w-3 h-3 rounded-full bg-gray-800" />
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-gray-50 border rounded-lg h-48 flex items-center justify-center mb-4">
            <span className="text-gray-400">
              {gym} - Projected Activity Chart
            </span>
          </div>

          {/* Opening Hours */}
          <div className="text-sm text-gray-600 mb-4">
            <p className="font-medium text-gray-700 mb-1">Opening Hours:</p>
            <p>
              Monday - Friday: <span className="font-medium">7am - 10pm</span>
            </p>
            <p>
              Saturday/Sunday: <span className="font-medium">10am - 5pm</span>
            </p>
          </div>

          {/* Report Button */}
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              ▶ Report Status
            </button>
          </div>
        </div>
  )
}

export default function Gym() {
  const [selectedGym, setSelectedGym] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-800">
          Gym Availability
        </h1>
        
        {selectedGym && <GymCard gym={selectedGym} />}

        {/* Projected Capactities */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Current Projected Capacities
          </h3>

          <ul className="space-y-3">
            {[
              { name: 'Gym A - RAWC', percent: 20 },
              { name: 'Gym B - RAWC', percent: 30}, 
              { name: 'Gym C - RAWC', percent: 35}, 
              { name: 'Weight Room - RAWC', percent: 45},
              { name: 'Pool - RAWC', percent: 50},
              { name: 'Tennis Courts', percent: 100}
            ].map((gym) => (
              <li key={gym.name}>
                <button 
                  onClick={() => setSelectedGym(gym.name)}
                  className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg px-4 py-3 text-left transition"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {gym.name}
                  </span>

                  <span className={`text-sm font-semibold ${getColor(gym.percent)}`}>
                    {gym.percent}%
                  </span>
                </button>
              </li>
            ))}
          </ul>

        </div>

      </div>
    </div>
  );
}
