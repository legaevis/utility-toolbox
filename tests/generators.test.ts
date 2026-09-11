import { describe, expect, it } from 'vitest';
import {
  generateEmails,
  generatePassword,
  generatePlaceholder,
  generateRandomNumbers,
  generateRandomString,
  generateRandomWords,
} from '../src/processors/generators';

describe('generatePassword', () => {
  it('respects length', () => {
    expect(generatePassword({ length: 24, lowercase: true, uppercase: true, numbers: true, symbols: true })).toHaveLength(24);
  });

  it('includes at least one character from every selected pool', () => {
    for (let i = 0; i < 20; i++) {
      const p = generatePassword({ length: 8, lowercase: true, uppercase: true, numbers: true, symbols: true });
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it('uses only selected pools', () => {
    const p = generatePassword({ length: 32, lowercase: false, uppercase: false, numbers: true, symbols: false });
    expect(p).toMatch(/^[0-9]+$/);
  });

  it('falls back to lowercase when nothing is selected', () => {
    const p = generatePassword({ length: 10, lowercase: false, uppercase: false, numbers: false, symbols: false });
    expect(p).toMatch(/^[a-z]+$/);
  });
});

describe('generateRandomString', () => {
  it('respects length and charset', () => {
    expect(generateRandomString(16, 'hex')).toMatch(/^[0-9a-f]{16}$/);
    expect(generateRandomString(10, 'digits')).toMatch(/^[0-9]{10}$/);
    expect(generateRandomString(8, 'custom', 'ab')).toMatch(/^[ab]{8}$/);
  });
});

describe('generateRandomWords', () => {
  it('generates the requested number of words', () => {
    expect(generateRandomWords(5).split(' ')).toHaveLength(5);
  });
});

describe('generateRandomNumbers', () => {
  it('stays within range (integers)', () => {
    const lines = generateRandomNumbers(5, 10, 50, false).split('\n');
    expect(lines).toHaveLength(50);
    for (const l of lines) {
      const v = Number(l);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('produces decimals when asked', () => {
    const lines = generateRandomNumbers(0, 1, 10, true).split('\n');
    for (const l of lines) {
      expect(l).toMatch(/^\d+\.\d{2}$/);
    }
  });
});

describe('generatePlaceholder', () => {
  it('generates words, sentences and paragraphs', () => {
    expect(generatePlaceholder('words', 7).split(' ')).toHaveLength(7);
    expect(generatePlaceholder('sentences', 3).match(/\./g)!.length).toBe(3);
    expect(generatePlaceholder('paragraphs', 2).split('\n\n')).toHaveLength(2);
  });
});

describe('generateEmails', () => {
  it('generates valid-looking test addresses on reserved domains', () => {
    const lines = generateEmails(10).split('\n');
    expect(lines).toHaveLength(10);
    for (const l of lines) {
      expect(l).toMatch(/^[a-z.]+\d+@(example\.(com|org|net)|test\.example)$/);
    }
  });
});
