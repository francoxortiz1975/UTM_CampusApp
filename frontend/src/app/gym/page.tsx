'use client'

import Header from '../../components/Header';
import { useState } from 'react';
import Modal from '../../components/Modal';
import CapacityCard from '../../components/CapacityCard';

//Temporary dummy data
const dummyCapacityData = [
  { time: '7 AM', capacity: 10 },
  { time: '8 AM', capacity: 35 },
  { time: '9 AM', capacity: 55 },
  { time: '10 AM', capacity: 70 },
  { time: '11 AM', capacity: 60 },
  { time: '12 PM', capacity: 45 },
  { time: '1 PM', capacity: 80 },
  { time: '2 PM', capacity: 65 },
  { time: '3 PM', capacity: 70 },
  { time: '4 PM', capacity: 90 },
  { time: '5 PM', capacity: 100 },
  { time: '6 PM', capacity: 70 },
  { time: '7 PM', capacity: 40 },
  { time: '8 PM', capacity: 20 },
  { time: '9 PM', capacity: 10 },
  { time: '10 PM', capacity: 10 },
];

const getColor = (p: number) =>
  p < 30 ? 'text-green-600' :
  p < 60 ? 'text-yellow-600' :
  'text-red-600';


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
        
        {selectedGym && (
          <CapacityCard
            title={selectedGym}
            location="RAWC"
            data={dummyCapacityData}
            additionalInfo={
              <>
                <p className="font-medium text-gray-700 mb-1">Opening Hours:</p>
                <p>Mon–Fri: <span className="text-black">7am – 10pm</span></p>
                <p>Sat–Sun: <span className="text-black">10am – 5pm</span></p>
              </>
            }
          />
        )}

        {/* Projected Capactities */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-black">
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
                  <span className="text-sm font-medium text-black">
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
