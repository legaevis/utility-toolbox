import { describe, expect, it } from 'vitest';
import { sortList } from '../src/processors/sortList';

describe('sortList', () => {
  it('sorts A→Z case-insensitively by default', () => {
    expect(sortList('banana\nApple\ncherry', 'az')).toBe('Apple\nbanana\ncherry');
  });

  it('sorts Z→A', () => {
    expect(sortList('a\nc\nb', 'za')).toBe('c\nb\na');
  });

  it('sorts russian alphabetically', () => {
    expect(sortList('яблоко\nАпельсин\nбанан', 'az')).toBe('Апельсин\nбанан\nяблоко');
  });

  it('sorts by length', () => {
    expect(sortList('aaa\na\naa', 'shortest')).toBe('a\naa\naaa');
    expect(sortList('a\naaa\naa', 'longest')).toBe('aaa\naa\na');
  });

  it('length sort counts emoji as one character', () => {
    expect(sortList('🎉🎉\nab🎉', 'shortest')).toBe('🎉🎉\nab🎉');
  });

  it('sorts numerically, non-numeric lines go last', () => {
    expect(sortList('10\n2\nfoo\n1', 'numAsc')).toBe('1\n2\n10\nfoo');
    expect(sortList('10\n2\n1', 'numDesc')).toBe('10\n2\n1');
  });

  it('parses decimal commas', () => {
    expect(sortList('1,5\n1,2', 'numAsc')).toBe('1,2\n1,5');
  });

  it('ignores empty lines by default, keeps them if asked', () => {
    expect(sortList('b\n\na', 'az')).toBe('a\nb');
    expect(sortList('b\n\na', 'az', { ignoreEmptyLines: false })).toBe('\na\nb');
  });

  it('trims when asked', () => {
    expect(sortList('  b\n a', 'az', { trim: true })).toBe('a\nb');
  });

  it('handles empty input', () => {
    expect(sortList('', 'az')).toBe('');
  });
});
