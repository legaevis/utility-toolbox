import { describe, expect, it } from 'vitest';
import { countText } from '../src/processors/counter';

describe('counter', () => {
  it('counts characters, words, lines', () => {
    const s = countText('Hello world\nПривет мир');
    expect(s.words).toBe(4);
    expect(s.lines).toBe(2);
    expect(s.characters).toBe(22);
    expect(s.charactersWithoutSpaces).toBe(19); // spaces and the line break excluded
  });

  it('returns zeros for empty input', () => {
    expect(countText('')).toEqual({ characters: 0, charactersWithoutSpaces: 0, words: 0, lines: 0 });
  });

  it('counts an emoji as one character', () => {
    expect(countText('🎉').characters).toBe(1);
    expect(countText('👨‍👩‍👧').characters).toBe(1); // ZWJ family
  });

  it('counts hyphenated and apostrophe words as one word', () => {
    expect(countText("don't stop кто-то").words).toBe(3);
  });

  it('counts lines including trailing empty line', () => {
    expect(countText('a\n').lines).toBe(2);
  });
});
