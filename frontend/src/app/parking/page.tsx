'use client'

import { ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppPageLayout from '../../components/AppPageLayout';
import CapacityCard from '../../components/CapacityCard';
import { cardSurface, focusRing } from '../../lib/ui-classes';

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
  p < 30 ? 'text-[var(--success)]' : p < 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]';

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
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000';
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
      <AppPageLayout
        title="Parking availability"
        description="Estimated lot fullness and rates. Pick a lot to view the trend and submit a quick report."
      >
        <div className="space-y-8">
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
                  <p className="mb-1 font-medium text-[var(--fg)]">Rates</p>
                  <p>
                    Half-hour:{' '}
                    <span className="text-[var(--fg-muted)]">${selectedParkingLot.halfHourRate.toFixed(2)}</span>
                  </p>
                  <p>
                    Daily:{' '}
                    <span className="text-[var(--fg-muted)]">${selectedParkingLot.dailyRate.toFixed(2)}</span>
                  </p>
                </>
              }
            />
          )}
  
          {/* Projected Capactities */}
          <section className={`${cardSurface} p-6`} aria-labelledby="parking-capacity-heading">
            <h2 id="parking-capacity-heading" className="text-lg font-semibold text-[var(--fg)]">
              Lots
            </h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Percent is the current estimate. Select a lot for the chart and reporting.
            </p>

            <ul className="mt-5 space-y-2">
              {PARKINGLOTS.map((lot) => {
                const percent = estimates[lot.name];
                const selected = selectedParkingLot?.name === lot.name;

                return (
                  <li key={lot.name}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={async () => {
                        setSelectedParkingLot(lot);

                        const data = await getFullDayReport(parkingId(lot.name));

                        setGraphData(data);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm motion-safe:transition-colors ${
                        selected
                          ? 'border-[var(--primary)] bg-[var(--surface-muted)]'
                          : 'border-transparent bg-[var(--surface-muted)]/60 hover:bg-[var(--surface-muted)]'
                      } ${focusRing}`}
                    >
                      <span className="font-medium text-[var(--fg)]">{lot.name}</span>

                      <span className="flex items-center gap-2">
                        <span
                          className={`font-semibold tabular-nums ${percent !== undefined ? getColor(percent) : 'text-[var(--fg-muted)]'}`}
                        >
                          {percent !== undefined ? `${percent}%` : 'Loading…'}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" aria-hidden />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </AppPageLayout>
    );
}
