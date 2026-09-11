import { describe, expect, it } from 'vitest';
import { convertWallTime, tzOffsetMs, wallTimeToEpoch } from '../src/processors/timezones';
import { formatTime } from '../src/localization/localeService';

describe('timezones', () => {
  it('computes known offsets', () => {
    const aug = Date.UTC(2026, 7, 14, 12, 0);
    expect(tzOffsetMs('Europe/Moscow', aug)).toBe(3 * 3600 * 1000);
    expect(tzOffsetMs('America/New_York', aug)).toBe(-4 * 3600 * 1000); // EDT
    expect(tzOffsetMs('Asia/Tokyo', aug)).toBe(9 * 3600 * 1000);
    expect(tzOffsetMs('UTC', aug)).toBe(0);
  });

  it('handles DST: New York in winter is UTC-5', () => {
    const jan = Date.UTC(2026, 0, 14, 12, 0);
    expect(tzOffsetMs('America/New_York', jan)).toBe(-5 * 3600 * 1000);
  });

  it('converts Moscow 15:00 → New York 08:00 (August)', () => {
    const epoch = convertWallTime({ year: 2026, month: 8, day: 14, hour: 15, minute: 0 }, 'Europe/Moscow');
    expect(formatTime(epoch, 'en-GB', 'America/New_York')).toBe('08:00');
  });

  it('converts London 15:05 → Tokyo 23:05 (August, BST)', () => {
    const epoch = convertWallTime({ year: 2026, month: 8, day: 14, hour: 15, minute: 5 }, 'Europe/London');
    expect(formatTime(epoch, 'en-GB', 'Asia/Tokyo')).toBe('23:05');
  });

  it('wall time in UTC equals Date.UTC', () => {
    expect(wallTimeToEpoch({ year: 2026, month: 8, day: 14, hour: 12, minute: 30 }, 'UTC')).toBe(
      Date.UTC(2026, 7, 14, 12, 30),
    );
  });
});
