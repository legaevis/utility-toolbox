/**
 * Single storage adapter for the whole app.
 *
 * All persistent data lives in localStorage under namespaced keys:
 *   utb.settings    — app settings
 *   utb.history     — recently used tools
 *   utb.favorites   — favorite tool ids
 *   utb.reports     — Daily Report entries
 *   utb.cache.*     — disposable per-tool state (last input, last options)
 *
 * The namespaces are what make Clear Cache / Clear History / Clear Reports /
 * Reset independent and safe: each action removes exactly its own prefix.
 *
 * Nothing here ever touches the network. If the app outgrows localStorage,
 * this adapter is the only file that changes (e.g. to file-based storage
 * via IPC) — consumers use the typed helpers below.
 */

const PREFIX = 'utb.';

export const KEYS = {
  settings: `${PREFIX}settings`,
  history: `${PREFIX}history`,
  favorites: `${PREFIX}favorites`,
  reports: `${PREFIX}reports`,
  cachePrefix: `${PREFIX}cache.`,
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage unavailable — never crash a tool over it.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function keysWithPrefix(prefix: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) out.push(k);
  }
  return out;
}

/** Removes disposable per-tool cache only. Never touches user data. */
export function clearCache(): void {
  keysWithPrefix(KEYS.cachePrefix).forEach(removeKey);
}

export function clearHistory(): void {
  removeKey(KEYS.history);
}

export function clearReports(): void {
  removeKey(KEYS.reports);
}

/** Full reset: removes every key the app has ever written. */
export function resetApplication(): void {
  keysWithPrefix(PREFIX).forEach(removeKey);
}

// ---- Per-tool cache (last input / options) -------------------------------

export function readToolCache<T>(toolId: string, fallback: T): T {
  return readJSON(`${KEYS.cachePrefix}${toolId}`, fallback);
}

export function writeToolCache(toolId: string, value: unknown): void {
  writeJSON(`${KEYS.cachePrefix}${toolId}`, value);
}
