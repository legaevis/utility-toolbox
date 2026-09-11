/**
 * Timezone math — fully offline, built on the platform's IANA timezone
 * data exposed through Intl. No external time APIs.
 */

export interface WallTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

/** The UTC offset (ms) of `tz` at the given epoch instant. */
export function tzOffsetMs(tz: string, epoch: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(epoch);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  // hourCycle quirk: "24" means midnight.
  const hour = get('hour') % 24;
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  // Truncate epoch to whole seconds the same way the formatter does.
  return asUtc - Math.floor(epoch / 1000) * 1000;
}

/**
 * Interprets a wall-clock time in `tz` and returns the epoch instant.
 * Two-pass offset estimation handles DST transitions for practical cases.
 */
export function wallTimeToEpoch(wall: WallTime, tz: string): number {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const offset1 = tzOffsetMs(tz, guess);
  const epoch1 = guess - offset1;
  const offset2 = tzOffsetMs(tz, epoch1);
  return guess - offset2;
}

/** "14 Aug 2026 15:00 in Moscow" → the same instant, ready to format in any zone. */
export function convertWallTime(wall: WallTime, fromTz: string): number {
  return wallTimeToEpoch(wall, fromTz);
}
