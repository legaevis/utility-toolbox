import type { OptionValues, ProcessResult } from '../types/tool';
import { joinLines } from './lines';

/**
 * Local random-data generators. Passwords and random strings use
 * crypto.getRandomValues when available (always true in Electron/browsers);
 * Math.random is only a fallback for bare Node test runs.
 */

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const g = globalThis.crypto;
  if (g && 'getRandomValues' in g) {
    // Rejection sampling to avoid modulo bias.
    const range = 0x100000000;
    const limit = range - (range % maxExclusive);
    const buf = new Uint32Array(1);
    let x: number;
    do {
      g.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function pick(chars: string): string {
  return chars[randomInt(chars.length)];
}

// ---- Password -------------------------------------------------------------

const LOWER = 'abcdefghijkmnopqrstuvwxyz'; // no l (ambiguous)
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O
const DIGITS = '23456789'; // no 0, 1
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generatePassword(o: PasswordOptions): string {
  const pools: string[] = [];
  if (o.lowercase) pools.push(LOWER);
  if (o.uppercase) pools.push(UPPER);
  if (o.numbers) pools.push(DIGITS);
  if (o.symbols) pools.push(SYMBOLS);
  if (pools.length === 0) pools.push(LOWER);

  const length = Math.max(4, Math.min(128, o.length || 16));
  const all = pools.join('');
  const chars: string[] = [];
  // Guarantee at least one character from every selected pool.
  for (const pool of pools) chars.push(pick(pool));
  while (chars.length < length) chars.push(pick(all));
  // Shuffle (Fisher–Yates).
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// ---- Random string --------------------------------------------------------

export type Charset = 'alphanumeric' | 'letters' | 'digits' | 'hex' | 'custom';

const CHARSETS: Record<Exclude<Charset, 'custom'>, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  hex: '0123456789abcdef',
};

export function generateRandomString(length: number, charset: Charset, custom = ''): string {
  const chars = charset === 'custom' ? custom || CHARSETS.alphanumeric : CHARSETS[charset];
  const n = Math.max(1, Math.min(4096, length || 32));
  let out = '';
  for (let i = 0; i < n; i++) out += pick(chars);
  return out;
}

// ---- Random words (pronounceable pseudo-words, offline) -------------------

const CONSONANTS = ['b', 'd', 'f', 'g', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'z', 'st', 'br', 'tr', 'kl'];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'ou'];

export type WordLength = 'short' | 'medium' | 'long';

function pseudoWord(len: WordLength): string {
  const syllables = len === 'short' ? 2 : len === 'long' ? 4 : 3;
  let w = '';
  for (let i = 0; i < syllables; i++) {
    w += CONSONANTS[randomInt(CONSONANTS.length)] + VOWELS[randomInt(VOWELS.length)];
  }
  return w;
}

export function generateRandomWords(count: number, len: WordLength = 'medium'): string {
  const n = Math.max(1, Math.min(1000, count || 10));
  return Array.from({ length: n }, () => pseudoWord(len)).join(' ');
}

// ---- Random numbers -------------------------------------------------------

export function generateRandomNumbers(min: number, max: number, amount: number, decimals: boolean): string {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const n = Math.max(1, Math.min(10000, amount || 10));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    if (decimals) {
      const v = lo + (randomInt(1_000_000) / 1_000_000) * (hi - lo);
      out.push(v.toFixed(2));
    } else {
      out.push(String(Math.floor(lo) + randomInt(Math.floor(hi) - Math.floor(lo) + 1)));
    }
  }
  return joinLines(out);
}

// ---- Placeholder text -----------------------------------------------------

const LOREM_WORDS =
  ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore ' +
    'magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo ' +
    'consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur ' +
    'sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');

export type PlaceholderUnit = 'words' | 'sentences' | 'paragraphs';

function loremSentence(): string {
  const len = 6 + randomInt(9);
  const words = Array.from({ length: len }, () => LOREM_WORDS[randomInt(LOREM_WORDS.length)]);
  const s = words.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

export function generatePlaceholder(unit: PlaceholderUnit, amount: number): string {
  const n = Math.max(1, Math.min(1000, amount || 3));
  if (unit === 'words') {
    return Array.from({ length: n }, () => LOREM_WORDS[randomInt(LOREM_WORDS.length)]).join(' ');
  }
  if (unit === 'sentences') {
    return Array.from({ length: n }, loremSentence).join(' ');
  }
  return Array.from({ length: n }, () => Array.from({ length: 3 + randomInt(3) }, loremSentence).join(' ')).join(
    '\n\n',
  );
}

// ---- Email generator (test addresses on reserved example domains) ---------

const EMAIL_DOMAINS = ['example.com', 'example.org', 'example.net', 'test.example'];

export function generateEmails(count: number): string {
  const n = Math.max(1, Math.min(1000, count || 5));
  return joinLines(
    Array.from({ length: n }, () => {
      const name = pseudoWord('short') + '.' + pseudoWord('short');
      const num = randomInt(100);
      return `${name}${num}@${EMAIL_DOMAINS[randomInt(EMAIL_DOMAINS.length)]}`;
    }),
  );
}

// ---- Processors -----------------------------------------------------------

function intOpt(options: OptionValues, key: string, fallback: number): number {
  const v = parseInt(String(options[key] ?? ''), 10);
  return Number.isNaN(v) ? fallback : v;
}

export function passwordProcessor(_input: string, options: OptionValues): ProcessResult {
  const count = Math.max(1, Math.min(50, intOpt(options, 'count', 5)));
  const opts: PasswordOptions = {
    length: intOpt(options, 'length', 16),
    lowercase: options.lowercase !== false,
    uppercase: options.uppercase !== false,
    numbers: options.numbers !== false,
    symbols: options.symbols === true,
  };
  return { output: joinLines(Array.from({ length: count }, () => generatePassword(opts))) };
}

export function randomStringProcessor(_input: string, options: OptionValues): ProcessResult {
  const count = Math.max(1, Math.min(100, intOpt(options, 'count', 5)));
  const length = intOpt(options, 'length', 32);
  const charset = (options.charset as Charset) || 'alphanumeric';
  const custom = String(options.custom ?? '');
  return {
    output: joinLines(Array.from({ length: count }, () => generateRandomString(length, charset, custom))),
  };
}

export function randomWordsProcessor(_input: string, options: OptionValues): ProcessResult {
  return {
    output: generateRandomWords(intOpt(options, 'count', 10), (options.wordLength as WordLength) || 'medium'),
  };
}

export function randomNumbersProcessor(_input: string, options: OptionValues): ProcessResult {
  return {
    output: generateRandomNumbers(
      intOpt(options, 'min', 1),
      intOpt(options, 'max', 100),
      intOpt(options, 'amount', 10),
      options.decimals === true,
    ),
  };
}

export function placeholderProcessor(_input: string, options: OptionValues): ProcessResult {
  return {
    output: generatePlaceholder((options.unit as PlaceholderUnit) || 'paragraphs', intOpt(options, 'amount', 3)),
  };
}

export function emailGeneratorProcessor(_input: string, options: OptionValues): ProcessResult {
  return { output: generateEmails(intOpt(options, 'count', 5)) };
}
