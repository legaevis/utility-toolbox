import { describe, expect, it } from 'vitest';
import {
  formatDateTime,
  formatNumber,
  resolveLocale,
  timeZoneCity,
} from '../src/localization/localeService';

describe('localeService', () => {
  it('formats numbers per region', () => {
    // Exact separators come from ICU; check the digit grouping differs correctly.
    expect(formatNumber(1234567.89, 'en-US')).toBe('1,234,567.89');
    expect(formatNumber(1234567.89, 'de-DE')).toBe('1.234.567,89');
    const ru = formatNumber(1234567.89, 'ru-RU');
    expect(ru).toContain(',89'); // decimal comma
    expect(ru).not.toContain('.');
  });

  it('formats dates per region (RU dd.mm.yyyy, US mm/dd/yyyy, JP yyyy/mm/dd)', () => {
    const ts = Date.UTC(2026, 7, 14, 17, 5);
    expect(formatDateTime(ts, 'ru-RU', 'UTC')).toContain('14.08.2026');
    expect(formatDateTime(ts, 'en-US', 'UTC')).toContain('8/14/26');
    expect(formatDateTime(ts, 'en-GB', 'UTC')).toContain('14/08/2026');
    expect(formatDateTime(ts, 'ja-JP', 'UTC')).toContain('2026/08/14');
  });

  it('US uses 12-hour clock with PM, RU uses 24-hour', () => {
    const ts = Date.UTC(2026, 7, 14, 17, 5);
    expect(formatDateTime(ts, 'en-US', 'UTC')).toMatch(/5:05\sPM/);
    expect(formatDateTime(ts, 'ru-RU', 'UTC')).toContain('17:05');
  });

  it('resolves regions to locales with sane fallbacks', () => {
    expect(resolveLocale('ru')).toBe('ru-RU');
    expect(resolveLocale('jp')).toBe('ja-JP');
    expect(resolveLocale('custom', 'de-AT')).toBe('de-AT');
    expect(typeof resolveLocale('auto')).toBe('string');
    expect(resolveLocale('custom', '!!!')).toBeTruthy(); // garbage falls back, never throws
  });

  it('derives city labels from timezone ids', () => {
    expect(timeZoneCity('America/New_York')).toBe('New York');
    expect(timeZoneCity('Europe/Moscow')).toBe('Moscow');
  });
});
