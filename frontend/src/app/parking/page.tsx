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
  p < 30 ? 'text-green-600' :
  p < 60 ? 'text-yellow-600' :
  'text-red-600';

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

async function getReport(location: string, time: number): Promise<number> {
  const now = new Date();

  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`http://localhost:5000/reports/${month}/${weekday}/${time}/parking/${location}`);
    if (!res.ok) return 50;

    const payload = await res.json();
    const estimate = payload?.estimate;
    return typeof estimate === 'number' ? estimate : 50;
  } catch {
    return 50;
  }
}

async function getFullDayReport(location: string): Promise<{ time: string; capacity: number }[]> {
  const month = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`http://localhost:5000/reports/${month}/${weekday}/parking/${location}`);
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
  
  useEffect(() => {
      async function loadEstimates() {
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
          { key: 'cct', name: 'CCT Garage' },
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

    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-800">
            Parking Availability
          </h1>
          
          {selectedParkingLot && (
            <CapacityCard
              title={selectedParkingLot.name}
              location={selectedParkingLot.location}
              data={graphData.length ? graphData : dummyCapacityData}
              reportType="parking"
              reportResourceId={selectedParkingLot.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}
              additionalInfo={
                <>
                  <p className="font-medium text-gray-700 mb-1">Rates:</p>
                  <p>Half-Hour Rates: <span className="text-black">${selectedParkingLot.halfHourRate.toFixed(2)}</span></p>
                  <p>Daily Rates: <span className="text-black">${selectedParkingLot.dailyRate.toFixed(2)}</span></p>
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
              {PARKINGLOTS.map((lot) => {
                const percent = estimates[lot.name];

                return (
                  <li key={lot.name}>
                    <button
                      onClick={async () => {
                        setSelectedParkingLot(lot);

                        const locationKey = lot.name.toLowerCase().replace(/[^a-z]/g, '');
                        const data = await getFullDayReport(locationKey);

                        setGraphData(data);
                      }}
                      className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg px-4 py-3 text-left transition"
                    >
                      <span className="text-sm font-medium text-black">
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
  
        </div>
      </div>
    );
}
