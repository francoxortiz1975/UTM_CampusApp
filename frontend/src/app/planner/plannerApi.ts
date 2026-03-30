function apiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5000`;
  }

  return 'http://localhost:5000';
}

export type SavedPlannerCalendar = {
  calendar_text: string | null;
  updated_at: string | null;
};

export async function loadSavedPlannerCalendar(): Promise<SavedPlannerCalendar | null> {
  try {
    const result = await fetch(`${apiBase()}/planner/calendar`, {
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
    const result = await fetch(`${apiBase()}/planner/calendar`, {
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
