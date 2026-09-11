import { readJSON, writeJSON } from './storage';
import type { RuleCategory } from '../processors/typograf/rules';
import { DEFAULT_CATEGORIES } from '../processors/typograf/engine';

/**
 * Local persistence for the Typograf tool. Three independent keys:
 *   utb.typograf          — rule settings (category toggles, language, layout fix)
 *   utb.symbolFavorites   — starred symbols (list of chars)
 *
 * These are USER DATA (like favorites), not cache: they survive Clear Cache
 * and are removed only by Reset Application.
 */

const KEY_SETTINGS = 'utb.typograf';
const KEY_FAVORITES = 'utb.symbolFavorites';

export interface TypografToolSettings {
  language: 'auto' | 'ru' | 'en';
  live: boolean;
  fixLayout: boolean;
  /** «Агрессивное форматирование» (§36) — style-changing transforms. */
  aggressive: boolean;
  categories: Record<RuleCategory, boolean>;
}

export const DEFAULT_TYPOGRAF_SETTINGS: TypografToolSettings = {
  language: 'auto',
  live: true,
  fixLayout: false,
  aggressive: false,
  categories: { ...DEFAULT_CATEGORIES },
};

export function loadTypografSettings(): TypografToolSettings {
  const stored = readJSON<Partial<TypografToolSettings>>(KEY_SETTINGS, {});
  return {
    ...DEFAULT_TYPOGRAF_SETTINGS,
    ...stored,
    categories: { ...DEFAULT_TYPOGRAF_SETTINGS.categories, ...(stored.categories ?? {}) },
  };
}

export function saveTypografSettings(s: TypografToolSettings): void {
  writeJSON(KEY_SETTINGS, s);
}

export function loadSymbolFavorites(): string[] {
  const list = readJSON<unknown>(KEY_FAVORITES, []);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

export function toggleSymbolFavorite(char: string): string[] {
  const current = loadSymbolFavorites();
  const next = current.includes(char) ? current.filter((c) => c !== char) : [...current, char];
  writeJSON(KEY_FAVORITES, next);
  return next;
}


