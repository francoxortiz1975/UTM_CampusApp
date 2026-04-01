function apiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5001`;
  }

  return 'http://localhost:5001';
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export type SavedPlannerCalendar = {
  calendar_text: string | null;
  updated_at: string | null;
};

export async function loadSavedPlannerCalendar(): Promise<SavedPlannerCalendar | null> {
  try {
    const result = await fetchWithTimeout(`${apiBase()}/planner/calendar`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!result.ok) return null;
    return await result.json();
  } catch {
    return null;
  }
}

export async function savePlannerCalendar(calendarText: string): Promise<SavedPlannerCalendar | null> {
  try {
    const result = await fetchWithTimeout(`${apiBase()}/planner/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ calendar_text: calendarText }),
    });

    if (!result.ok) return null;
    return await result.json();
  } catch {
    return null;
  }
}
