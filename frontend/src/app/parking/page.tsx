'use client'

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import CapacityCard from '../../components/CapacityCard';

const dummyCapacityData = [
  { time: '12 AM', capacity: 0 },
  { time: '1 AM', capacity: 5 },
  { time: '2 AM', capacity: 5 },
  { time: '3 AM', capacity: 5 },
  { time: '4 AM', capacity: 5 },
  { time: '5 AM', capacity: 5 },
  { time: '6 PM', capacity: 20 },
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
  p < 30 ? 'text-green-600 dark:text-green-400' :
  p < 60 ? 'text-yellow-600 dark:text-yellow-400' :
  'text-red-600 dark:text-red-400';

interface ParkingLot {
  name: string;
  location: string;
  capacity: number;
  halfHourRate: number;
  dailyRate: number
}

const PARKINGLOTS: ParkingLot[] = [
  {
    name:"P1",
    location: "UTM",
    capacity: 20,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P4",
    location: "UTM",
    capacity: 60,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P5",
    location: "UTM",
    capacity: 40,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P6",
    location: "UTM",
    capacity: 60,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P7",
    location: "UTM",
    capacity: 10,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P8",
    location: "UTM",
    capacity: 50,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P9",
    location: "UTM",
    capacity: 10,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P10",
    location: "UTM",
    capacity: 30,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "P11",
    location: "UTM",
    capacity: 10,
    halfHourRate: 2.50,
    dailyRate: 15
  },
  {
    name: "CCT Garage",
    location: "UTM",
    capacity: 70,
    halfHourRate: 2.50,
    dailyRate: 15
  },

]

const now = new Date();
const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5001'
    : 'http://localhost:5001';
const PARKING_OVERRIDES_KEY = 'placeholder:parkingCapacityOverrides';
const parkingId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '_');

async function getReport(location: string, time: number): Promise<number> {
  const now = new Date();

  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`${apiBase}/reports/${month}/${weekday}/${time}/parking/${location}`);
    if (!res.ok) return 50;

    const payload = await res.json();
    console.log("API returned:", payload); 
    const estimate = payload?.estimate;
    return typeof estimate === 'number' ? estimate : 50;
  } catch {
    return 50;
  }
}

async function getFullDayReport(location: string): Promise<{ time: string; capacity: number }[]> {
  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`${apiBase}/reports/${month}/${weekday}/parking/${location}`);
    if (!res.ok) return dummyCapacityData;

    const payload = await res.json();
    if (!Array.isArray(payload)) return dummyCapacityData;
    return payload;
  } catch {
    return dummyCapacityData;
  }
}

export default function Parking() {
  const [selectedParkingLot, setSelectedParkingLot] = useState<ParkingLot | null>(null);
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [graphData, setGraphData] = useState<{ time: string; capacity: number }[]>([]);

  const locations = [
          { key: 'p1', name: 'P1' },
          { key: 'p4', name: 'P4' },
          { key: 'p5', name: 'P5' },
          { key: 'p6', name: 'P6' },
          { key: 'p7', name: 'P7' },
          { key: 'p8', name: 'P8' },
          { key: 'p9', name: 'P9' },
          { key: 'p10', name: 'P10' },
          { key: 'p11', name: 'P11' },
          { key: 'cct_garage', name: 'CCT Garage' },
        ];
  
  async function loadEstimates() {
  
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
  
  useEffect(() => {
      loadEstimates();
    }, []);

    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#0b0c10] dark:text-zinc-100">
        <div className="pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full bg-white/70 blur-3xl dark:bg-white/10" />
        <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-600/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl dark:bg-zinc-500/10" />
        <Header />
        <main id="main-content" className="mx-auto max-w-6xl space-y-6 p-6">
          {/* Page Title */}
          <h1 className="font-display pb-1 text-3xl leading-[1.28] font-bold bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">
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
                const data = await getFullDayReport(parkingId(selectedParkingLot.name));
                setGraphData(data);
              }}
              additionalInfo={
                <>
                  <p className="mb-1 font-medium text-gray-700 dark:text-zinc-300">Rates:</p>
                  <p>Half-Hour Rates: <span className="text-black dark:text-zinc-100">${selectedParkingLot.halfHourRate.toFixed(2)}</span></p>
                  <p>Daily Rates: <span className="text-black dark:text-zinc-100">${selectedParkingLot.dailyRate.toFixed(2)}</span></p>
                </>
              }
            />
          )}
  
          {/* Projected Capactities */}
          <div className="rounded-xl bg-white p-6 shadow dark:bg-zinc-900 dark:shadow-zinc-950/50">
            <h3 className="mb-4 text-lg font-semibold text-black dark:text-zinc-100">
              Current Projected Capacities
            </h3>
  
            <ul className="space-y-3">
              {PARKINGLOTS.map((lot) => {
                const percent = estimates[lot.name];

                return (
                  <li key={lot.name}>
                    <button
                      type="button"
                      onClick={async () => {
                        setSelectedParkingLot(lot);

                        const data = await getFullDayReport(parkingId(lot.name));

                        setGraphData(data);
                      }}
                      className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100 active:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
                    >
                      <span className="text-sm font-medium text-black dark:text-zinc-100">
                        {lot.name}
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
  
        </main>
      </div>
    );
}
