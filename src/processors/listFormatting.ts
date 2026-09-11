import type { OptionValues, ProcessResult } from '../types/tool';
import { joinLines, splitLines } from './lines';

// ---- Words to Column ------------------------------------------------------

export type WordsToColumnMode = 'words' | 'case';

/**
 * 'words': "One two three" → one word per line (extra whitespace dropped).
 * 'case':  split glued phrases at case boundaries — a lowercase letter,
 *          digit or closing quote/bracket followed by an Uppercase letter
 *          starts a new line, while spaces INSIDE a phrase survive:
 *          "Умные кавычкиТире" → "Умные кавычки\nТире".
 */
export function wordsToColumn(text: string, mode: WordsToColumnMode = 'words'): string {
  if (mode === 'case') {
    const broken = text.replace(/([\p{Ll}\p{Nd}»”“"'’)\]…])(?=\p{Lu})/gu, '$1\n');
    return joinLines(
      splitLines(broken)
        .map((l) => l.trim())
        .filter((l) => l !== ''),
    );
  }
  const words = text.split(/\s+/u).filter((w) => w !== '');
  return joinLines(words);
}

export function wordsToColumnProcessor(input: string, options: OptionValues = {}): ProcessResult {
  return { output: wordsToColumn(input, (options.mode as WordsToColumnMode) || 'words') };
}

// ---- Merge Lines ----------------------------------------------------------

export type MergeSeparator = 'space' | 'comma' | 'semicolon' | 'custom';

export function mergeLines(
  text: string,
  separator: MergeSeparator,
  customSeparator = '',
  skipEmpty = true,
): string {
  let lines = splitLines(text).map((l) => l.trim());
  if (skipEmpty) lines = lines.filter((l) => l !== '');
  const sep =
    separator === 'space' ? ' ' : separator === 'comma' ? ', ' : separator === 'semicolon' ? '; ' : customSeparator;
  return lines.join(sep);
}

export function mergeLinesProcessor(input: string, options: OptionValues): ProcessResult {
  return {
    output: mergeLines(
      input,
      (options.separator as MergeSeparator) || 'space',
      String(options.customSeparator ?? ''),
      options.skipEmpty !== false,
    ),
  };
}

// ---- Reverse List ---------------------------------------------------------

export function reverseList(text: string): string {
  return joinLines(splitLines(text).reverse());
}

export function reverseListProcessor(input: string): ProcessResult {
  return { output: reverseList(input) };
}

// ---- Add Line Numbers -----------------------------------------------------

export type NumberStyle = 'arabic' | 'letters' | 'roman';

function toLetters(n: number): string {
  // 1 → a, 26 → z, 27 → aa …
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(97 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(n: number): string {
  if (n <= 0) return String(n);
  let s = '';
  for (const [value, sym] of ROMAN) {
    while (n >= value) {
      s += sym;
      n -= value;
    }
  }
  return s;
}

export function addLineNumbers(
  text: string,
  style: NumberStyle = 'arabic',
  start = 1,
  skipEmpty = false,
): string {
  let counter = start;
  return joinLines(
    splitLines(text).map((line) => {
      if (skipEmpty && !/\S/.test(line)) return line;
      const label =
        style === 'letters' ? toLetters(counter) : style === 'roman' ? toRoman(counter) : String(counter);
      counter++;
      return `${label}. ${line}`;
    }),
  );
}

export function addLineNumbersProcessor(input: string, options: OptionValues): ProcessResult {
  const start = parseInt(String(options.start ?? '1'), 10);
  return {
    output: addLineNumbers(
      input,
      (options.style as NumberStyle) || 'arabic',
      Number.isNaN(start) ? 1 : start,
      options.skipEmpty === true,
    ),
  };
}

// ---- Insert Text (before/after each line) ---------------------------------

export function insertText(text: string, prefix: string, suffix: string, skipEmpty = true): string {
  return joinLines(
    splitLines(text).map((line) => {
      if (skipEmpty && !/\S/.test(line)) return line;
      return `${prefix}${line}${suffix}`;
    }),
  );
}

export function insertTextProcessor(input: string, options: OptionValues): ProcessResult {
  return {
    output: insertText(
      input,
      String(options.prefix ?? ''),
      String(options.suffix ?? ''),
      options.skipEmpty !== false,
    ),
  };
}

// ---- Tabs ↔ Spaces --------------------------------------------------------

export function tabsToSpaces(text: string, width: number): string {
  return text.replace(/\t/g, ' '.repeat(width));
}

export function spacesToTabs(text: string, width: number): string {
  return text.replace(new RegExp(` {${width}}`, 'g'), '\t');
}

export function tabsSpacesProcessor(input: string, options: OptionValues): ProcessResult {
  const width = parseInt(String(options.tabWidth ?? '4'), 10) || 4;
  const mode = options.mode === 'spaces2tabs' ? 'spaces2tabs' : 'tabs2spaces';
  return {
    output: mode === 'tabs2spaces' ? tabsToSpaces(input, width) : spacesToTabs(input, width),
  };
}
