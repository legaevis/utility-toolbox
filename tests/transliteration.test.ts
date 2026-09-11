import { describe, expect, it } from 'vitest';
import { transliterateLatToRu, transliterateRuToLat } from '../src/processors/transliteration';

describe('transliteration', () => {
  it('transliterates russian to latin (common scheme)', () => {
    expect(transliterateRuToLat('Привет')).toBe('Privet');
    expect(transliterateRuToLat('Жуковский')).toBe('Zhukovskiy');
    expect(transliterateRuToLat('щи')).toBe('shchi');
  });

  it('passport scheme differs where expected', () => {
    expect(transliterateRuToLat('Яна', 'passport')).toBe('Iana');
    expect(transliterateRuToLat('Яна', 'common')).toBe('Yana');
    expect(transliterateRuToLat('подъезд', 'passport')).toBe('podieezd');
  });

  it('drops soft/hard signs in common scheme', () => {
    expect(transliterateRuToLat('область')).toBe('oblast');
  });

  it('preserves case for multi-letter mappings', () => {
    expect(transliterateRuToLat('Шар')).toBe('Shar');
  });

  it('leaves latin, digits and emoji untouched', () => {
    expect(transliterateRuToLat('abc 123 🎉')).toBe('abc 123 🎉');
  });

  it('transliterates latin back to russian greedily', () => {
    expect(transliterateLatToRu('Privet')).toBe('Привет');
    expect(transliterateLatToRu('shchi')).toBe('щи');
    expect(transliterateLatToRu('zhuk')).toBe('жук');
  });

  it('handles empty input', () => {
    expect(transliterateRuToLat('')).toBe('');
    expect(transliterateLatToRu('')).toBe('');
  });
});
