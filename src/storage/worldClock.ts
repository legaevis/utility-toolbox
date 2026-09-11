import { readJSON, writeJSON } from './storage';

const KEY = 'utb.worldclock';

export const DEFAULT_CITIES = ['Europe/Moscow', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];

export function loadCities(): string[] {
  const list = readJSON<unknown>(KEY, DEFAULT_CITIES);
  return Array.isArray(list) && list.length > 0
    ? list.filter((x): x is string => typeof x === 'string')
    : [...DEFAULT_CITIES];
}

export function saveCities(cities: string[]): void {
  writeJSON(KEY, cities);
}
