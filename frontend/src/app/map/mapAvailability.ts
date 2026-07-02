'use client';

import type { MapBuildingConfig, MapResourceConfig, MapResourceKind } from './mapData';

export type MapResourceSnapshot = {
    kind: MapResourceKind;
    id: string;
    name: string;
    value: number;
    displayValue: string;
    score: number;
};

export type MapBuildingStatus = {
    score: number;
    label: 'Quiet' | 'Moderate' | 'Busy';
    tone: 'green' | 'yellow' | 'red';
    resources: {
        food: MapResourceSnapshot[];
        gym: MapResourceSnapshot[];
        parking: MapResourceSnapshot[];
    };
};

const apiBase =
    typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
        ? '/api'
        : '/api';

function getTimeContext() {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        weekday: now
            .toLocaleString('en-US', { weekday: 'long' })
            .toLowerCase(),
        hour: now.getHours(),
    };
}

/** Fetch with a timeout — returns the response or throws on timeout */
function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function roundValue(value: number) {
    return Math.max(0, Math.round(value));
}

function normaliseFoodWait(waitMinutes: number) {
    return Math.min((waitMinutes / 15) * 100, 100);
}

function labelForScore(score: number): MapBuildingStatus['label'] {
    if (score <= 34) return 'Quiet';
    if (score <= 64) return 'Moderate';
    return 'Busy';
}

function toneForScore(score: number): MapBuildingStatus['tone'] {
    if (score <= 34) return 'green';
    if (score <= 64) return 'yellow';
    return 'red';
}

function groupResources(resources: MapResourceSnapshot[]) {
    return {
        food: resources.filter((resource) => resource.kind === 'food'),
        gym: resources.filter((resource) => resource.kind === 'gym'),
        parking: resources.filter((resource) => resource.kind === 'parking'),
    };
}

function averageScore(resources: MapResourceSnapshot[]) {
    if (resources.length === 0) return 0;
    return resources.reduce((sum, resource) => sum + resource.score, 0) / resources.length;
}

async function fetchFoodEstimate(resource: MapResourceConfig, overrideHour?: number): Promise<MapResourceSnapshot> {
    const ctx = getTimeContext();
    const hour = overrideHour ?? ctx.hour;
    const { month, weekday } = ctx;

    try {
        const response = await fetchWithTimeout(
            `${apiBase}/reports/${month}/${weekday}/${hour}/food/${resource.id}`
        );

        if (!response.ok) throw new Error('Food estimate unavailable');

        const payload = await response.json();
        const estimate =
            typeof payload?.estimate === 'number' ? payload.estimate : resource.fallbackValue;

        return {
            kind: 'food',
            id: resource.id,
            name: resource.name,
            value: roundValue(estimate),
            displayValue: `${roundValue(estimate)} min`,
            score: normaliseFoodWait(estimate),
        };
    } catch {
        return {
            kind: 'food',
            id: resource.id,
            name: resource.name,
            value: resource.fallbackValue,
            displayValue: `${resource.fallbackValue} min`,
            score: normaliseFoodWait(resource.fallbackValue),
        };
    }
}

async function fetchCapacityEstimate(
    resource: MapResourceConfig,
    overrideHour?: number
): Promise<MapResourceSnapshot> {
    const ctx = getTimeContext();
    const hour = overrideHour ?? ctx.hour;
    const { month, weekday } = ctx;

    try {
        const response = await fetchWithTimeout(
            `${apiBase}/reports/${month}/${weekday}/${hour}/${resource.kind}/${resource.id}`
        );

        if (!response.ok) throw new Error('Capacity estimate unavailable');

        const payload = await response.json();
        const estimate =
            typeof payload?.estimate === 'number' ? payload.estimate : resource.fallbackValue;

        return {
            kind: resource.kind,
            id: resource.id,
            name: resource.name,
            value: roundValue(estimate),
            displayValue: `${roundValue(estimate)}%`,
            score: roundValue(estimate),
        };
    } catch {
        return {
            kind: resource.kind,
            id: resource.id,
            name: resource.name,
            value: resource.fallbackValue,
            displayValue: `${resource.fallbackValue}%`,
            score: resource.fallbackValue,
        };
    }
}

async function loadResourceSnapshot(resource: MapResourceConfig, overrideHour?: number) {
    if (resource.kind === 'food') {
        return fetchFoodEstimate(resource, overrideHour);
    }

    return fetchCapacityEstimate(resource, overrideHour);
}

export function buildFallbackStatus(building: MapBuildingConfig): MapBuildingStatus {
    const resources = building.resources.map((resource) => {
        if (resource.kind === 'food') {
            return {
                kind: resource.kind,
                id: resource.id,
                name: resource.name,
                value: resource.fallbackValue,
                displayValue: `${resource.fallbackValue} min`,
                score: normaliseFoodWait(resource.fallbackValue),
            } satisfies MapResourceSnapshot;
        }

        return {
            kind: resource.kind,
            id: resource.id,
            name: resource.name,
            value: resource.fallbackValue,
            displayValue: `${resource.fallbackValue}%`,
            score: resource.fallbackValue,
        } satisfies MapResourceSnapshot;
    });

    const score = averageScore(resources);

    return {
        score,
        label: labelForScore(score),
        tone: toneForScore(score),
        resources: groupResources(resources),
    };
}

export async function loadBuildingStatus(
    building: MapBuildingConfig,
    overrideHour?: number
): Promise<MapBuildingStatus> {
    const resources = await Promise.all(
        building.resources.map((r) => loadResourceSnapshot(r, overrideHour))
    );
    const score = averageScore(resources);

    return {
        score,
        label: labelForScore(score),
        tone: toneForScore(score),
        resources: groupResources(resources),
    };
}

export async function loadAllBuildingStatuses(buildings: MapBuildingConfig[], overrideHour?: number) {
    const statuses = await Promise.all(
        buildings.map(async (building) => [
            building.id,
            await loadBuildingStatus(building, overrideHour),
        ] as const)
    );

    return Object.fromEntries(statuses) as Record<string, MapBuildingStatus>;
}

/**
 * Load building statuses for multiple hours of the day.
 * Returns a map of hour → building statuses, allowing time-projected estimates.
 */
export async function loadHourlyBuildingStatuses(
    buildings: MapBuildingConfig[],
    hours: number[]
): Promise<Record<number, Record<string, MapBuildingStatus>>> {
    const entries = await Promise.all(
        hours.map(async (hour) => {
            const statuses = await loadAllBuildingStatuses(buildings, hour);
            return [hour, statuses] as const;
        })
    );
    return Object.fromEntries(entries);
}
