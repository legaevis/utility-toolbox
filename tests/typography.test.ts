import { describe, expect, it } from 'vitest';
import { formatTypography } from '../src/processors/typography';

describe('typography', () => {
  it('converts straight quotes to guillemets', () => {
    expect(formatTypography('Он сказал "привет" мне')).toBe('Он сказал «привет» мне');
  });

  it('supports curly quote style', () => {
    expect(formatTypography('say "hi" now', { quoteStyle: 'curly' })).toBe('say “hi” now');
  });

  it('converts double hyphen and spaced hyphen to em dash', () => {
    expect(formatTypography('a -- b')).toBe('a — b');
    expect(formatTypography('это - тест')).toBe('это — тест');
  });

  it('converts numeric ranges to en dash', () => {
    expect(formatTypography('5-10 штук')).toBe('5–10 штук');
  });

  it('does not break dates with two hyphens', () => {
    expect(formatTypography('2026-08-13')).toBe('2026-08-13');
  });

  it('keeps hyphenated words intact', () => {
    expect(formatTypography('кто-то что-то')).toBe('кто-то что-то');
  });

  it('normalizes spaces around punctuation', () => {
    expect(formatTypography('слово ,  слово')).toBe('слово, слово');
  });

  it('never touches URLs or emails', () => {
    const url = 'см. https://ex.com/a--b?range=5-10 и mail@test.ru';
    const out = formatTypography(url);
    expect(out).toContain('https://ex.com/a--b?range=5-10');
    expect(out).toContain('mail@test.ru');
  });

  it('never touches code blocks', () => {
    const code = 'код `a -- b "x"` и ```\nx - y\n```';
    const out = formatTypography(code);
    expect(out).toContain('`a -- b "x"`');
    expect(out).toContain('x - y');
  });

  it('adds non-breaking spaces after short words when enabled', () => {
    const out = formatTypography('в лесу', { nbsp: true });
    expect(out).toBe('в\u00A0лесу');
  });

  it('individual transforms can be disabled', () => {
    expect(formatTypography('a -- b', { dashes: false })).toBe('a -- b');
    expect(formatTypography('"x"', { quotes: false })).toBe('"x"');
  });

  it('handles empty input', () => {
    expect(formatTypography('')).toBe('');
  });
});
