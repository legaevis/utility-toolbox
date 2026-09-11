import { describe, expect, it } from 'vitest';
import { cleanText } from '../src/processors/textCleaner';

describe('textCleaner', () => {
  it('removes extra spaces', () => {
    expect(cleanText('a  b   c', { removeExtraSpaces: true })).toBe('a b c');
  });

  it('removes all spaces', () => {
    expect(cleanText('a b c', { removeAllSpaces: true })).toBe('abc');
  });

  it('trims lines', () => {
    expect(cleanText('  a  \n  b  ', { trimLines: true })).toBe('a\nb');
  });

  it('removes empty lines', () => {
    expect(cleanText('a\n\n\nb', { removeEmptyLines: true })).toBe('a\nb');
  });

  it('removes whitespace-only lines but keeps content', () => {
    expect(cleanText('a\n   \nb', { removeWhitespaceOnlyLines: true })).toBe('a\nb');
  });

  it('removes all line breaks', () => {
    expect(cleanText('a\nb\r\nc', { removeAllLineBreaks: true })).toBe('abc');
  });

  it('replaces line breaks with spaces', () => {
    expect(cleanText('a\nb\nc', { replaceLineBreaksWithSpaces: true })).toBe('a b c');
  });

  it('replaces spaces with line breaks', () => {
    expect(cleanText('a b c', { replaceSpacesWithLineBreaks: true })).toBe('a\nb\nc');
  });

  it('removes tabs / replaces tabs with spaces', () => {
    expect(cleanText('a\tb', { removeTabs: true })).toBe('ab');
    expect(cleanText('a\tb', { replaceTabsWithSpaces: true })).toBe('a b');
  });

  it('removes spaces and line breaks together (incl. tabs and nbsp)', () => {
    expect(cleanText('a b\nc\td', { removeSpacesAndLineBreaks: true })).toBe('abcd');
  });

  it('combines operations predictably', () => {
    expect(
      cleanText('  a   b  \n\n  c  ', { removeExtraSpaces: true, trimLines: true, removeEmptyLines: true }),
    ).toBe('a b\nc');
  });

  it('handles unicode and empty input', () => {
    expect(cleanText('', { removeExtraSpaces: true })).toBe('');
    expect(cleanText('привет  🎉  мир', { removeExtraSpaces: true })).toBe('привет 🎉 мир');
  });
});
