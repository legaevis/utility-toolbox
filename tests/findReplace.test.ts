import { describe, expect, it } from 'vitest';
import { countMatches, findReplace } from '../src/processors/findReplace';

describe('findReplace', () => {
  it('replaces all occurrences case-insensitively by default', () => {
    const r = findReplace('Cat cat CAT', { find: 'cat', replaceWith: 'dog' });
    expect(r.output).toBe('dog dog dog');
    expect(r.matches).toBe(3);
    expect(r.replaced).toBe(3);
  });

  it('respects case sensitivity', () => {
    const r = findReplace('Cat cat', { find: 'cat', replaceWith: 'dog', caseSensitive: true });
    expect(r.output).toBe('Cat dog');
    expect(r.matches).toBe(1);
  });

  it('replaces only first when replaceAll is false', () => {
    const r = findReplace('a a a', { find: 'a', replaceWith: 'b', replaceAll: false });
    expect(r.output).toBe('b a a');
    expect(r.replaced).toBe(1);
    expect(r.matches).toBe(3);
  });

  it('whole word works for latin and cyrillic', () => {
    expect(findReplace('кот котик', { find: 'кот', replaceWith: 'пёс', wholeWord: true }).output).toBe(
      'пёс котик',
    );
    expect(findReplace('cat category', { find: 'cat', replaceWith: 'dog', wholeWord: true }).output).toBe(
      'dog category',
    );
  });

  it('treats find and replacement as literal text', () => {
    expect(findReplace('1+1=2', { find: '1+1', replaceWith: '2' }).output).toBe('2=2');
    expect(findReplace('x', { find: 'x', replaceWith: '$&y' }).output).toBe('$&y');
  });

  it('returns unchanged text when nothing matches or find is empty', () => {
    expect(findReplace('abc', { find: 'z', replaceWith: 'y' })).toEqual({
      output: 'abc',
      matches: 0,
      replaced: 0,
    });
    expect(findReplace('abc', { find: '', replaceWith: 'y' }).output).toBe('abc');
  });

  it('counts matches without replacing', () => {
    expect(countMatches('aaa', 'a')).toBe(3);
    expect(countMatches('слово слово', 'слово')).toBe(2);
  });
});
