import { describe, expect, it } from 'vitest';
import {
  addLineNumbers,
  insertText,
  mergeLines,
  reverseList,
  spacesToTabs,
  tabsToSpaces,
  wordsToColumn,
} from '../src/processors/listFormatting';

describe('wordsToColumn', () => {
  it('splits words into lines and drops extra whitespace', () => {
    expect(wordsToColumn('One  two\tthree\nfour ')).toBe('One\ntwo\nthree\nfour');
  });

  it('handles cyrillic and empty input', () => {
    expect(wordsToColumn('раз два')).toBe('раз\nдва');
    expect(wordsToColumn('')).toBe('');
  });
});

describe('mergeLines', () => {
  it('joins with space, comma, semicolon', () => {
    expect(mergeLines('Apple\nBanana\nOrange', 'space')).toBe('Apple Banana Orange');
    expect(mergeLines('a\nb', 'comma')).toBe('a, b');
    expect(mergeLines('a\nb', 'semicolon')).toBe('a; b');
  });

  it('supports a custom separator and keeps empty lines when asked', () => {
    expect(mergeLines('a\nb', 'custom', ' | ')).toBe('a | b');
    expect(mergeLines('a\n\nb', 'comma', '', false)).toBe('a, , b');
    expect(mergeLines('a\n\nb', 'comma')).toBe('a, b');
  });
});

describe('reverseList', () => {
  it('reverses line order', () => {
    expect(reverseList('Apple\nBanana\nOrange')).toBe('Orange\nBanana\nApple');
  });

  it('handles empty input', () => {
    expect(reverseList('')).toBe('');
  });
});

describe('addLineNumbers', () => {
  it('numbers lines with arabic numerals', () => {
    expect(addLineNumbers('Apple\nBanana\nOrange')).toBe('1. Apple\n2. Banana\n3. Orange');
  });

  it('supports letters and roman numerals', () => {
    expect(addLineNumbers('a\nb\nc', 'letters')).toBe('a. a\nb. b\nc. c');
    expect(addLineNumbers('x\ny\nz\nw', 'roman')).toBe('I. x\nII. y\nIII. z\nIV. w');
  });

  it('letters continue past z', () => {
    expect(addLineNumbers('x', 'letters', 27)).toBe('aa. x');
  });

  it('supports a custom start value', () => {
    expect(addLineNumbers('a\nb', 'arabic', 10)).toBe('10. a\n11. b');
  });

  it('can skip empty lines without consuming numbers', () => {
    expect(addLineNumbers('a\n\nb', 'arabic', 1, true)).toBe('1. a\n\n2. b');
  });
});

describe('insertText', () => {
  it('adds prefix and suffix to each line', () => {
    expect(insertText('Apple\nBanana', '- ', '')).toBe('- Apple\n- Banana');
    expect(insertText('a\nb', '', ';')).toBe('a;\nb;');
  });

  it('skips empty lines by default', () => {
    expect(insertText('a\n\nb', '- ', '')).toBe('- a\n\n- b');
  });
});

describe('tabs/spaces', () => {
  it('converts tabs to spaces with a given width', () => {
    expect(tabsToSpaces('a\tb', 4)).toBe('a    b');
    expect(tabsToSpaces('a\tb', 2)).toBe('a  b');
  });

  it('converts spaces back to tabs', () => {
    expect(spacesToTabs('a    b', 4)).toBe('a\tb');
    expect(spacesToTabs('a  b', 2)).toBe('a\tb');
  });
});

describe('wordsToColumn: by case change', () => {
  it('splits glued phrases at case boundaries, keeping inner spaces', () => {
    const input =
      'Умные кавычкиТиреПробелыНеразрывные пробелыПунктуацияСпецсимволыЧислаДатыВалютыТелефоныИспользовать «ё»Исправлять раскладку';
    expect(wordsToColumn(input, 'case')).toBe(
      [
        'Умные кавычки',
        'Тире',
        'Пробелы',
        'Неразрывные пробелы',
        'Пунктуация',
        'Спецсимволы',
        'Числа',
        'Даты',
        'Валюты',
        'Телефоны',
        'Использовать «ё»',
        'Исправлять раскладку',
      ].join('\n'),
    );
  });

  it('splits after digits and closing quotes/brackets too', () => {
    expect(wordsToColumn('Пункт 1Пункт 2', 'case')).toBe('Пункт 1\nПункт 2');
    expect(wordsToColumn('(один)Два', 'case')).toBe('(один)\nДва');
  });

  it('leaves already-split lines and normal text alone', () => {
    expect(wordsToColumn('Раз\nДва', 'case')).toBe('Раз\nДва');
    expect(wordsToColumn('Обычное предложение без склеек', 'case')).toBe(
      'Обычное предложение без склеек',
    );
  });

  it('default mode still splits every word', () => {
    expect(wordsToColumn('Раз два три')).toBe('Раз\nдва\nтри');
  });
});
