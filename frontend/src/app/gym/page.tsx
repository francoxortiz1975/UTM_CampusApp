'use client'

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
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

interface buttonCapacities{
  name: String;
  capacity: number
}

const getColor = (p: number) =>
  p < 30 ? 'text-green-600' :
  p < 60 ? 'text-yellow-600' :
  'text-red-600';

const now = new Date();

async function getReport(location: String, time: number) {
  const now = new Date();

  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  const res = await fetch(`http://localhost:5000/reports/${month}/${weekday}/${time}/gym/${location}`);
  
  if (!res.ok) {
    throw new Error("Failed to fetch report");
  }

  const {estimate} = await res.json();
  return estimate;
}

async function getFullDayReport(location: String){
  const month = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  const res = await fetch(
    `http://localhost:5000/reports/${month}/${weekday}/gym/${location}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch day report");
  }

  return await res.json();
}


export default function Gym() {
  const [selectedGym, setSelectedGym] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [graphData, setGraphData] = useState<{ time: string; capacity: number }[]>([]);


  useEffect(() => {
    async function loadEstimates() {
      const locations = [
        { key: 'gyma', name: 'Gym A - RAWC' },
        { key: 'gymb', name: 'Gym B - RAWC' },
        { key: 'gymc', name: 'Gym C - RAWC' },
        { key: 'weightroom', name: 'Weight Room - RAWC' },
        { key: 'pool', name: 'Pool - RAWC' },
        { key: 'tennis', name: 'Tennis Courts' }
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
    }

    loadEstimates();
  }, []);

  const gyms = [
    'Gym A - RAWC',
    'Gym B - RAWC',
    'Gym C - RAWC',
    'Weight Room - RAWC',
    'Pool - RAWC',
    'Tennis Courts'
  ];

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
            data={graphData.length ? graphData : dummyCapacityData}
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
            {gyms.map((name) => {
              const percent = estimates[name];

              return (
                <li key={name}>
                  <button
                    onClick={async () => {
                      setSelectedGym(name);

                      const locationKey = name.toLowerCase().replace(/[^a-z]/g, '');
                      const data = await getFullDayReport(locationKey);

                      setGraphData(data);
                    }}
                    className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg px-4 py-3 text-left transition"
                  >
                    <span className="text-sm font-medium text-black">
                      {name}
                    </span>

                    <span className={`text-sm font-semibold ${percent !== undefined ? getColor(percent) : ''}`}>
                      {percent !== undefined ? `${percent}%` : 'Loading...'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

        </div>

      </div>
    </div>
  );
}
