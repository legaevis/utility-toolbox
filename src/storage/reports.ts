import { KEYS, readJSON, writeJSON } from './storage';

export interface ReportEntry {
  id: string;
  /** Plain text (may contain markdown-style lists and URLs). */
  text: string;
  /** Unix ms. */
  createdAt: number;
}

export function loadEntries(): ReportEntry[] {
  const list = readJSON<unknown>(KEYS.reports, []);
  if (!Array.isArray(list)) return [];
  return list.filter(
    (e): e is ReportEntry =>
      !!e &&
      typeof e === 'object' &&
      typeof (e as ReportEntry).id === 'string' &&
      typeof (e as ReportEntry).text === 'string' &&
      typeof (e as ReportEntry).createdAt === 'number',
  );
}

function persist(entries: ReportEntry[]): void {
  writeJSON(KEYS.reports, entries);
}

export function addEntry(text: string, now: number = Date.now()): ReportEntry[] {
  const entry: ReportEntry = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt: now,
  };
  const next = [...loadEntries(), entry];
  persist(next);
  return next;
}

export function updateEntry(id: string, text: string): ReportEntry[] {
  const next = loadEntries().map((e) => (e.id === id ? { ...e, text } : e));
  persist(next);
  return next;
}

export function deleteEntry(id: string): ReportEntry[] {
  const next = loadEntries().filter((e) => e.id !== id);
  persist(next);
  return next;
}
