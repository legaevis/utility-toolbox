import { describe, expect, it } from 'vitest';
import { detectDirection, switchLayout } from '../src/processors/layoutSwitcher';

describe('layoutSwitcher', () => {
  it('converts the canonical example Ghbdtn → Привет', () => {
    expect(switchLayout('Ghbdtn', 'en2ru')).toBe('Привет');
  });

  it('converts руддщ → hello', () => {
    expect(switchLayout('руддщ', 'ru2en')).toBe('hello');
  });

  it('is reversible for letters', () => {
    const original = 'privet mir';
    expect(switchLayout(switchLayout(original, 'en2ru'), 'ru2en')).toBe(original);
  });

  it('preserves case', () => {
    expect(switchLayout('GhBdTn', 'en2ru')).toBe('ПрИвЕт');
  });

  it('maps punctuation keys', () => {
    expect(switchLayout(';', 'en2ru')).toBe('ж');
    expect(switchLayout('/', 'en2ru')).toBe('.');
    expect(switchLayout('ж', 'ru2en')).toBe(';');
  });

  it('auto-detects direction', () => {
    expect(detectDirection('Ghbdtn')).toBe('en2ru');
    expect(detectDirection('руддщ')).toBe('ru2en');
    expect(switchLayout('Ghbdtn', 'auto')).toBe('Привет');
    expect(switchLayout('руддщ', 'auto')).toBe('hello');
  });

  it('leaves digits, spaces and emoji untouched', () => {
    expect(switchLayout('123 🎉', 'en2ru')).toBe('123 🎉');
  });

  it('handles empty input', () => {
    expect(switchLayout('', 'auto')).toBe('');
  });

  it('maps ё both ways', () => {
    expect(switchLayout('`', 'en2ru')).toBe('ё');
    expect(switchLayout('ё', 'ru2en')).toBe('`');
  });
});
