import { describe, expect, it } from 'vitest';
import { compareLists } from '../src/processors/compareLists';

describe('compareLists', () => {
  it('finds common and unique items', () => {
    const r = compareLists('a\nb\nc', 'b\nc\nd');
    expect(r.common).toEqual(['b', 'c']);
    expect(r.onlyA).toEqual(['a']);
    expect(r.onlyB).toEqual(['d']);
    expect(r.unique).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is case-insensitive by default', () => {
    const r = compareLists('Apple', 'apple');
    expect(r.common).toEqual(['Apple']);
    expect(r.onlyA).toEqual([]);
    expect(r.onlyB).toEqual([]);
  });

  it('respects case sensitivity', () => {
    const r = compareLists('Apple', 'apple', { caseSensitive: true });
    expect(r.common).toEqual([]);
    expect(r.onlyA).toEqual(['Apple']);
    expect(r.onlyB).toEqual(['apple']);
  });

  it('trims and ignores empty lines by default', () => {
    const r = compareLists('  a  \n\n', 'a');
    expect(r.common).toEqual(['a']);
  });

  it('dedupes within each list', () => {
    const r = compareLists('a\na\nb', 'a');
    expect(r.common).toEqual(['a']);
    expect(r.onlyA).toEqual(['b']);
    expect(r.unique).toEqual(['a', 'b']);
  });

  it('handles cyrillic', () => {
    const r = compareLists('Москва\nПитер', 'москва');
    expect(r.common).toEqual(['Москва']);
    expect(r.onlyA).toEqual(['Питер']);
  });

  it('handles empty inputs', () => {
    const r = compareLists('', '');
    expect(r.common).toEqual([]);
    expect(r.unique).toEqual([]);
  });
});
