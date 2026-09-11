import { describe, expect, it } from 'vitest';
import {
  entriesInRange,
  generateReportHtml,
  generateReportText,
  resolvePeriod,
} from '../src/processors/reportGenerator';
import type { ReportEntry } from '../src/storage/reports';

function entry(id: string, createdAt: number, text: string): ReportEntry {
  return { id, createdAt, text };
}

describe('reportGenerator', () => {
  const now = new Date(2026, 7, 13, 15, 0).getTime(); // Aug 13 2026, Thursday

  it('resolves today / yesterday ranges', () => {
    const today = resolvePeriod('today', now);
    expect(new Date(today.from).getDate()).toBe(13);
    expect(today.to - today.from).toBe(86400000);

    const yesterday = resolvePeriod('yesterday', now);
    expect(new Date(yesterday.from).getDate()).toBe(12);
  });

  it('resolves a monday-based week', () => {
    const week = resolvePeriod('week', now);
    expect(new Date(week.from).getDay()).toBe(1); // Monday
    expect(week.to - week.from).toBe(7 * 86400000);
  });

  it('filters and sorts entries in range', () => {
    const range = resolvePeriod('today', now);
    const entries = [
      entry('b', now + 1000, 'later'),
      entry('a', now, 'earlier'),
      entry('c', now - 86400000 * 2, 'old'),
    ];
    expect(entriesInRange(entries, range).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('generates entries only — no title, no date, no extra lines', () => {
    const report = generateReportText([
      entry('1', now, 'Сделал экран авторизации'),
      entry('2', now + 1, 'Исправил ошибки в онбординге'),
    ]);
    expect(report).toBe('• Сделал экран авторизации\n• Исправил ошибки в онбординге');
    expect(report).not.toMatch(/Report|Отчёт|—/);
  });

  it('keeps bare URLs untouched in the plain report', () => {
    const report = generateReportText([entry('1', now, 'https://figma.com/file/123')]);
    expect(report).toBe('• https://figma.com/file/123');
  });

  it('keeps the URL of markdown links in the plain report', () => {
    const report = generateReportText([entry('1', now, '[Макет](https://figma.com/file/123)')]);
    expect(report).toBe('• Макет (https://figma.com/file/123)');
  });

  it('keeps text + URL entries intact', () => {
    const report = generateReportText([entry('1', now, 'Сделал макет: https://figma.com/file/123')]);
    expect(report).toBe('• Сделал макет: https://figma.com/file/123');
  });

  it('indents multi-line entries under their bullet', () => {
    expect(generateReportText([entry('1', now, 'a\nb')])).toBe('• a\n  b');
  });

  it('returns empty string for empty periods', () => {
    expect(generateReportText([])).toBe('');
    expect(generateReportHtml([])).toBe('');
  });

  it('html report contains real clickable anchors', () => {
    const html = generateReportHtml([
      entry('1', now, 'Макет: https://figma.com/file/123'),
      entry('2', now + 1, '[Доска](https://miro.com/b?x=1&y=2)'),
    ]);
    expect(html).toBe(
      '<ul>' +
        '<li>Макет: <a href="https://figma.com/file/123">https://figma.com/file/123</a></li>' +
        '<li><a href="https://miro.com/b?x=1&amp;y=2">Доска</a></li>' +
        '</ul>',
    );
  });
});
