/**
 * LocaleService — the single formatting layer for the whole app.
 *
 * Every tool that needs to display numbers, dates, times or units goes
 * through these functions; no tool implements its own formatting.
 * Built entirely on the standard Intl APIs (offline, no dependencies).
 *
 * Two independent concepts, never mixed:
 *   - the exact numeric/temporal VALUE (always computed precisely);
 *   - its PRESENTATION for a region (Intl formatting, applied at the end).
 */

export type RegionId = 'auto' | 'ru' | 'us' | 'uk' | 'de' | 'fr' | 'jp' | 'custom';

export const REGIONS: { id: RegionId; locale: string | null }[] = [
  { id: 'auto', locale: null },
  { id: 'ru', locale: 'ru-RU' },
  { id: 'us', locale: 'en-US' },
  { id: 'uk', locale: 'en-GB' },
  { id: 'de', locale: 'de-DE' },
  { id: 'fr', locale: 'fr-FR' },
  { id: 'jp', locale: 'ja-JP' },
  { id: 'custom', locale: null },
];

/** Resolves a region choice to a concrete BCP-47 locale tag. */
export function resolveLocale(region: RegionId, customLocale = ''): string {
  if (region === 'custom' && customLocale.trim() !== '') {
    try {
      // Validate the tag; fall back to auto on garbage input.
      new Intl.Locale(customLocale.trim());
      return customLocale.trim();
    } catch {
      /* fall through */
    }
  }
  if (region !== 'auto' && region !== 'custom') {
    const found = REGIONS.find((r) => r.id === region);
    if (found?.locale) return found.locale;
  }
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
}

// ---- Numbers --------------------------------------------------------------

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 6, ...options }).format(value);
  } catch {
    return String(value);
  }
}

// ---- Dates & times --------------------------------------------------------

export function formatTime(ts: number, locale: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone }).format(ts);
  } catch {
    return new Date(ts).toISOString();
  }
}

export function formatDate(ts: number, locale: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone }).format(ts);
  } catch {
    return new Date(ts).toISOString();
  }
}

export function formatDateTime(ts: number, locale: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone,
    }).format(ts);
  } catch {
    return new Date(ts).toISOString();
  }
}

export function formatWeekday(ts: number, locale: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone }).format(ts);
  } catch {
    return '';
  }
}

// ---- Relative time --------------------------------------------------------

export function formatRelative(deltaMs: number, locale: string): string {
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const minutes = Math.round(deltaMs / 60000);
    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
    return rtf.format(Math.round(hours / 24), 'day');
  } catch {
    return '';
  }
}

// ---- Timezones ------------------------------------------------------------

/** All IANA timezones known to the runtime — offline, no external data. */
export function allTimeZones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'Europe/Moscow', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];
  }
}

/** "America/New_York" → "New York" — a readable label without extra data. */
export function timeZoneCity(tz: string): string {
  const last = tz.split('/').pop() ?? tz;
  return last.replace(/_/g, ' ');
}

/** GMT offset label for a timezone at a given moment, e.g. "GMT+3". */
export function timeZoneOffsetLabel(tz: string, ts: number, locale: string): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(ts);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}
