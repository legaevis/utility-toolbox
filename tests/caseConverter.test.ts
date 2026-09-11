import { describe, expect, it } from 'vitest';
import { convertCase } from '../src/processors/caseConverter';

describe('caseConverter', () => {
  it('uppercases latin and cyrillic', () => {
    expect(convertCase('hello Привет', 'upper')).toBe('HELLO ПРИВЕТ');
  });

  it('lowercases latin and cyrillic', () => {
    expect(convertCase('HELLO ПРИВЕТ', 'lower')).toBe('hello привет');
  });

  it('title-cases mixed language text', () => {
    expect(convertCase('hello world привет мир', 'title')).toBe('Hello World Привет Мир');
  });

  it('title-case lowercases the rest of each word', () => {
    expect(convertCase('hELLO wORLD', 'title')).toBe('Hello World');
  });

  it('sentence-cases after punctuation and line breaks', () => {
    expect(convertCase('первое. второе! third? fourth', 'sentence')).toBe(
      'Первое. Второе! Third? Fourth',
    );
    expect(convertCase('one\ntwo', 'sentence')).toBe('One\nTwo');
  });

  it('inverse alternates letter case, skipping non-letters', () => {
    expect(convertCase('abcd', 'inverse')).toBe('AbCd');
    expect(convertCase('аб вг', 'inverse')).toBe('Аб Вг');
  });

  it('capitalizeWords keeps existing case of the tail', () => {
    expect(convertCase('iPhone уже здесь', 'capitalizeWords')).toBe('IPhone Уже Здесь');
  });

  it('capitalizeFirst capitalizes only the first letter', () => {
    expect(convertCase('  привет мир', 'capitalizeFirst')).toBe('  Привет мир');
  });

  it('handles empty input', () => {
    expect(convertCase('', 'upper')).toBe('');
  });

  it('leaves emoji and special characters intact', () => {
    expect(convertCase('hi 🎉 №5', 'upper')).toBe('HI 🎉 №5');
  });
});
