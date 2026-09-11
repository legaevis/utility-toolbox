import { describe, expect, it } from 'vitest';
import { removeDuplicates } from '../src/processors/removeDuplicates';

describe('removeDuplicates', () => {
  it('removes duplicate lines keeping first occurrence', () => {
    expect(removeDuplicates('Apple\nBanana\nApple\nOrange')).toBe('Apple\nBanana\nOrange');
  });

  it('is case-insensitive by default', () => {
    expect(removeDuplicates('apple\nApple')).toBe('apple');
  });

  it('respects case sensitivity', () => {
    expect(removeDuplicates('apple\nApple', { caseSensitive: true })).toBe('apple\nApple');
  });

  it('keeps last occurrence when asked', () => {
    expect(removeDuplicates('a\nb\na\nc', { keep: 'last' })).toBe('b\na\nc');
  });

  it('ignores surrounding spaces when asked', () => {
    expect(removeDuplicates('a\n  a  ', { ignoreSurroundingSpaces: true })).toBe('a');
    expect(removeDuplicates('a\n  a  ')).toBe('a\n  a  ');
  });

  it('handles cyrillic and emoji', () => {
    expect(removeDuplicates('Привет\nпривет\n🎉\n🎉')).toBe('Привет\n🎉');
  });

  it('handles empty input', () => {
    expect(removeDuplicates('')).toBe('');
  });
});
