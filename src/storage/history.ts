import { KEYS, readJSON, writeJSON } from './storage';

const MAX_HISTORY = 8;

/** Most-recently-used tool ids, newest first. Stores ids only — never content. */
export function loadHistory(): string[] {
  const list = readJSON<unknown>(KEYS.history, []);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

export function pushHistory(toolId: string): string[] {
  const next = [toolId, ...loadHistory().filter((id) => id !== toolId)].slice(0, MAX_HISTORY);
  writeJSON(KEYS.history, next);
  return next;
}
