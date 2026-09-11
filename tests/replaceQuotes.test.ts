import { describe, expect, it } from 'vitest';
import { replaceQuotes } from '../src/processors/replaceQuotes';

describe('replaceQuotes', () => {
  it('converts straight quotes to guillemets', () => {
    expect(replaceQuotes('Он сказал "привет"', 'guillemet')).toBe('Он сказал «привет»');
  });

  it('converts curly to guillemets and back', () => {
    expect(replaceQuotes('“Hello”', 'guillemet')).toBe('«Hello»');
    expect(replaceQuotes('«Hello»', 'curly')).toBe('“Hello”');
  });

  it('converts typographic quotes back to straight', () => {
    expect(replaceQuotes('«а» и “б”', 'straight')).toBe('"а" и "б"');
  });

  it('never touches quotes inside URLs or code', () => {
    const s = 'код `"x"` и https://ex.com/?q="y" тут "текст"';
    const out = replaceQuotes(s, 'guillemet');
    expect(out).toContain('`"x"`');
    expect(out).toContain('«текст»');
  });

  it('handles empty input', () => {
    expect(replaceQuotes('', 'curly')).toBe('');
  });
});
