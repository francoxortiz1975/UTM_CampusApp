'use client'

import { ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppPageLayout from '../../components/AppPageLayout';
import CapacityCard from '../../components/CapacityCard';
import { cardSurface, focusRing } from '../../lib/ui-classes';

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
  p < 30 ? 'text-[var(--success)]' : p < 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]';

const now = new Date();
const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000';
const GYM_OVERRIDES_KEY = 'placeholder:gymCapacityOverrides';
const gymId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '_');
const GYMS = [
  'Gym A - RAWC',
  'Gym B - RAWC',
  'Gym C - RAWC',
  'Weight Room - RAWC',
  'Pool - RAWC',
  'Tennis Courts',
];

async function getReport(location: string, time: number): Promise<number> {
  const now = new Date();

  const month = now.getMonth() + 1;
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

  try {
    const res = await fetch(`${apiBase}/reports/${month}/${weekday}/${time}/gym/${location}`);
    if (!res.ok) return 50;

    const payload = await res.json();
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
    const res = await fetch(
      `${apiBase}/reports/${month}/${weekday}/gym/${location}`
    );

    if (!res.ok) return dummyCapacityData;

    const payload = await res.json();
    if (!Array.isArray(payload)) return dummyCapacityData;
    return payload;
  } catch {
    return dummyCapacityData;
  }
}


export default function Gym() {
  const [selectedGym, setSelectedGym] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [graphData, setGraphData] = useState<{ time: string; capacity: number }[]>([]);

  const locations = [
        { key: 'gyma', name: 'Gym A - RAWC' },
        { key: 'gymb', name: 'Gym B - RAWC' },
        { key: 'gymc', name: 'Gym C - RAWC' },
        { key: 'weightroom', name: 'Weight Room - RAWC' },
        { key: 'pool', name: 'Pool - RAWC' },
        { key: 'tennis', name: 'Tennis Courts' }
      ];

  const locations_map: Record<string, string> = {
    'Gym A - RAWC': 'gyma',
    'Gym B - RAWC': 'gymb',
    'Gym C - RAWC': 'gymc',
    'Weight Room - RAWC': 'weightroom',
    'Pool - RAWC': 'pool',
    'Tennis Courts': 'tennis'
  };

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
      title="Gym availability"
      description="See how busy each RAWC space is. Select a location for the full-day chart and to report how full it feels."
    >
      <div className="space-y-8">
        {selectedGym && (
          <CapacityCard
            title={selectedGym}
            location={'RAWC'}
            data={graphData.length ? graphData : dummyCapacityData}
            reportType="gym"
            reportResourceId={locations_map[selectedGym]}
            onReportSubmitted={async () => {
              await loadEstimates();
              const graph_data = await getFullDayReport(locations_map[selectedGym]);
              setGraphData(graph_data);
            }}
            additionalInfo={
              <>
                <p className="mb-1 font-medium text-[var(--fg)]">Opening hours</p>
                <p>
                  Mon–Fri: <span className="text-[var(--fg-muted)]">7am – 10pm</span>
                </p>
                <p>
                  Sat–Sun: <span className="text-[var(--fg-muted)]">10am – 5pm</span>
                </p>
              </>
            }
          />
        )}

        {/* Projected Capactities */}
        <section className={`${cardSurface} p-6`} aria-labelledby="gym-capacity-heading">
          <h2 id="gym-capacity-heading" className="text-lg font-semibold text-[var(--fg)]">
            Locations
          </h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Percent shows estimated occupancy for right now. Select a row for details.
          </p>

          <ul className="mt-5 space-y-2">
            {GYMS.map((name) => {
              const percent = estimates[name];
              const selected = selectedGym === name;

              return (
                <li key={name}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={async () => {
                      setSelectedGym(name);

                      const data = await getFullDayReport(locations_map[name]);

                      setGraphData(data);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm motion-safe:transition-colors ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--surface-muted)]'
                        : 'border-transparent bg-[var(--surface-muted)]/60 hover:bg-[var(--surface-muted)]'
                    } ${focusRing}`}
                  >
                    <span className="font-medium text-[var(--fg)]">{name}</span>

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
