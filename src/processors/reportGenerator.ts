import type { ReportEntry } from '../storage/reports';
import { linkifyToHtml, linkifyToPlain } from './linkify';

export type ReportPeriod = 'today' | 'yesterday' | 'week' | 'custom';

export interface ReportRange {
  /** Inclusive start, unix ms. */
  from: number;
  /** Exclusive end, unix ms. */
  to: number;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const DAY = 24 * 60 * 60 * 1000;

export function resolvePeriod(period: ReportPeriod, now: number, custom?: ReportRange): ReportRange {
  const today = startOfDay(now);
  switch (period) {
    case 'today':
      return { from: today, to: today + DAY };
    case 'yesterday':
      return { from: today - DAY, to: today };
    case 'week': {
      // Monday-based current week.
      const d = new Date(today);
      const weekday = (d.getDay() + 6) % 7; // 0 = Monday
      const monday = today - weekday * DAY;
      return { from: monday, to: monday + 7 * DAY };
    }
    case 'custom':
      return custom ?? { from: today, to: today + DAY };
  }
}

export function entriesInRange(entries: ReportEntry[], range: ReportRange): ReportEntry[] {
  return entries
    .filter((e) => e.createdAt >= range.from && e.createdAt < range.to)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Plain-text report: entries only — no title, no date, no extra lines.
 * Bare URLs stay untouched; markdown links keep both label and working URL.
 * Returns '' when there are no entries.
 */
export function generateReportText(selected: ReportEntry[]): string {
  return selected
    .map((e) => {
      // Multi-line entries: first line becomes the bullet, the rest is indented.
      const [first, ...rest] = e.text.split('\n');
      return ['• ' + linkifyToPlain(first), ...rest.map((r) => '  ' + linkifyToPlain(r))].join('\n');
    })
    .join('\n');
}

/**
 * HTML report for the rich clipboard: a plain <ul> with real <a href> links,
 * no inline styles — receiving apps apply their own formatting.
 */
export function generateReportHtml(selected: ReportEntry[]): string {
  if (selected.length === 0) return '';
  const items = selected
    .map((e) => `<li>${e.text.split('\n').map(linkifyToHtml).join('<br>')}</li>`)
    .join('');
  return `<ul>${items}</ul>`;
}
