import { KEYS, readJSON, writeJSON } from './storage';

export function loadFavorites(): string[] {
  const list = readJSON<unknown>(KEYS.favorites, []);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

export function toggleFavorite(toolId: string): string[] {
  const current = loadFavorites();
  const next = current.includes(toolId)
    ? current.filter((id) => id !== toolId)
    : [...current, toolId];
  writeJSON(KEYS.favorites, next);
  return next;
}
