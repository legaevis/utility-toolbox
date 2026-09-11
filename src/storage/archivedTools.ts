import { readJSON, writeJSON } from './storage';

const KEY = 'utb.archivedTools';

/**
 * Archived tools disappear from the tool list column (categories, favorites
 * and search). They are never deleted — the Archive panel lists them and
 * restores them with one click. Cleared only by Reset Application.
 */
export function loadArchivedTools(): string[] {
  const list = readJSON<unknown>(KEY, []);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

export function toggleArchivedTool(toolId: string): string[] {
  const current = loadArchivedTools();
  const next = current.includes(toolId)
    ? current.filter((id) => id !== toolId)
    : [...current, toolId];
  writeJSON(KEY, next);
  return next;
}
