'use client';

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import CapacityCard from '../../components/CapacityCard';

type CapacityPoint = { time: string; capacity: number };

const dummyCapacityData: CapacityPoint[] = [
  { time: '12 AM', capacity: 0 },
  { time: '1 AM', capacity: 5 },
  { time: '2 AM', capacity: 5 },
  { time: '3 AM', capacity: 5 },
  { time: '4 AM', capacity: 5 },
  { time: '5 AM', capacity: 5 },
  { time: '6 AM', capacity: 20 },
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
  { time: '11 PM', capacity: 10 },
];

const getColor = (p: number) =>
  p < 30
    ? 'text-green-600 dark:text-green-400'
    : p < 60
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-red-600 dark:text-red-400';

interface ParkingLot {
  name: string;
  location: string;
  capacity: number;
  halfHourRate: number;
  dailyRate: number;
}

const PARKINGLOTS: ParkingLot[] = [
  { name: 'P1', location: 'UTM', capacity: 20, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P4', location: 'UTM', capacity: 60, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P5', location: 'UTM', capacity: 40, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P6', location: 'UTM', capacity: 60, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P7', location: 'UTM', capacity: 10, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P8', location: 'UTM', capacity: 50, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P9', location: 'UTM', capacity: 10, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P10', location: 'UTM', capacity: 30, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'P11', location: 'UTM', capacity: 10, halfHourRate: 2.5, dailyRate: 15 },
  { name: 'CCT Garage', location: 'UTM', capacity: 70, halfHourRate: 2.5, dailyRate: 15 },
];

const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? '/api'
    : '/api';

const parkingId = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '_');

async function getReport(location: string, time: number): Promise<number> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const weekday = now
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  try {
    const res = await fetch(
      `${apiBase}/reports/${month}/${weekday}/${time}/parking/${location}`
    );
    if (!res.ok) return 50;

    const data = await res.json();
    return typeof data?.estimate === 'number' ? data.estimate : 50;
  } catch {
    return 50;
  }
}

async function getFullDayReport(location: string): Promise<CapacityPoint[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const weekday = now
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  try {
    const res = await fetch(
      `${apiBase}/reports/${month}/${weekday}/parking/${location}`
    );
    if (!res.ok) return dummyCapacityData;

    const data = await res.json();
    return Array.isArray(data) ? data : dummyCapacityData;
  } catch {
    return dummyCapacityData;
  }
}

export default function Parking() {
  const [selectedParkingLot, setSelectedParkingLot] = useState<ParkingLot | null>(null);
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [graphData, setGraphData] = useState<CapacityPoint[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);

  const locations = PARKINGLOTS.map((lot) => ({
    key: parkingId(lot.name),
    name: lot.name,
  }));

  const loadEstimates = async () => {
    const now = new Date();
    const time = now.getHours();

    const results = await Promise.all(
      locations.map(async (loc) => ({
        name: loc.name,
        estimate: await getReport(loc.key, time),
      }))
    );

    const mapped: Record<string, number> = {};
    results.forEach((r) => {
      mapped[r.name] = r.estimate;
    });

    setEstimates(mapped);
  };

  useEffect(() => {
    loadEstimates();
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-[#0b0c10] text-slate-900 dark:text-zinc-100">
      <Header />

      <main className="mx-auto max-w-6xl p-6 space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">
          Parking Availability
        </h1>

        {selectedParkingLot && (
          <CapacityCard
            title={selectedParkingLot.name}
            location={selectedParkingLot.location}
            data={graphData.length ? graphData : dummyCapacityData}
            reportType="parking"
            reportResourceId={parkingId(selectedParkingLot.name)}
            onReportSubmitted={async () => {
              await loadEstimates();
              const data = await getFullDayReport(
                parkingId(selectedParkingLot.name)
              );
              setGraphData(data);
            }}
            additionalInfo={
              <div>
                <p className="font-medium">Rates:</p>
                <p>Half-hour: ${selectedParkingLot.halfHourRate.toFixed(2)}</p>
                <p>Daily: ${selectedParkingLot.dailyRate.toFixed(2)}</p>
              </div>
            }
          />
        )}

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
          <h3 className="mb-4 text-lg font-semibold">Current Projected Capacities</h3>

          <ul className="space-y-3">
            {PARKINGLOTS.map((lot) => {
              const percent = estimates[lot.name];

              return (
                <li key={lot.name}>
                  <button
                    onClick={async () => {
                      setSelectedParkingLot(lot);
                      setLoadingGraph(true);

                      const data = await getFullDayReport(parkingId(lot.name));

                      setGraphData(data);
                      setLoadingGraph(false);
                    }}
                    className="flex w-full justify-between bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-lg"
                  >
                    <span>{lot.name}</span>

                    <span
                      className={
                        typeof percent === 'number' ? getColor(percent) : ''
                      }
                    >
                      {typeof percent === 'number'
                        ? `${percent}%`
                        : 'Loading...'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}