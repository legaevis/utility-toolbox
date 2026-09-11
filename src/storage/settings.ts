import { KEYS, readJSON, writeJSON } from './storage';
import type { ToolCategory } from '../types/tool';
import type { RegionId } from '../localization/localeService';

export type AppLanguage = 'en' | 'ru';
export type AppTheme = 'system' | 'light' | 'dark';

export interface AppSettings {
  /** UI language only — never affects how text is processed. */
  language: AppLanguage;
  /** Visual theme; 'system' follows the OS appearance live. */
  theme: AppTheme;
  saveHistory: boolean;
  clearCacheOnQuit: boolean;
  /** Region & Format: default presentation locale for numbers/dates/units.
   *  Independent from the UI language and from timezones. */
  region: RegionId;
  /** BCP-47 tag used when region === 'custom'. */
  customLocale: string;
  /** Sidebar: which categories are visible and in what order.
   *  Display-only — tools always stay available via search and Home. */
  sidebarOrder: ToolCategory[];
  sidebarEnabled: Record<ToolCategory, boolean>;
}

export const ALL_CATEGORIES: ToolCategory[] = [
  'text',
  'lists',
  'formatting',
  'converters',
  'generators',
  'extractors',
  'time',
];

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'system',
  saveHistory: true,
  clearCacheOnQuit: false,
  region: 'auto',
  customLocale: '',
  sidebarOrder: [...ALL_CATEGORIES],
  // Sensible first-run set; the user enables the rest in Settings → Sidebar.
  sidebarEnabled: {
    text: true,
    lists: true,
    formatting: false,
    converters: true,
    generators: false,
    extractors: false,
    time: true,
  },
};

export function loadSettings(): AppSettings {
  const stored = readJSON<Partial<AppSettings>>(KEYS.settings, {});
  // Deep-merge the nested sidebar fields so new categories added in app
  // updates get defaults instead of disappearing.
  const order = (stored.sidebarOrder ?? []).filter((c): c is ToolCategory =>
    ALL_CATEGORIES.includes(c as ToolCategory),
  );
  for (const cat of ALL_CATEGORIES) if (!order.includes(cat)) order.push(cat);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    sidebarOrder: order,
    sidebarEnabled: { ...DEFAULT_SETTINGS.sidebarEnabled, ...(stored.sidebarEnabled ?? {}) },
  };
}

export function saveSettings(settings: AppSettings): void {
  writeJSON(KEYS.settings, settings);
}
