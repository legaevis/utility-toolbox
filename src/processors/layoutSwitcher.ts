import type { OptionValues, ProcessResult } from '../types/tool';

/**
 * Keyboard Layout Switcher: fixes text typed in the wrong layout.
 * This is a character-for-character mapping between the standard
 * US QWERTY and Russian ЙЦУКЕН layouts — NOT translation.
 */

// Lowercase key-for-key pairs, US QWERTY → ЙЦУКЕН.
const EN_TO_RU_PAIRS: [string, string][] = [
  ['`', 'ё'],
  ['q', 'й'], ['w', 'ц'], ['e', 'у'], ['r', 'к'], ['t', 'е'], ['y', 'н'],
  ['u', 'г'], ['i', 'ш'], ['o', 'щ'], ['p', 'з'], ['[', 'х'], [']', 'ъ'],
  ['a', 'ф'], ['s', 'ы'], ['d', 'в'], ['f', 'а'], ['g', 'п'], ['h', 'р'],
  ['j', 'о'], ['k', 'л'], ['l', 'д'], [';', 'ж'], ["'", 'э'],
  ['z', 'я'], ['x', 'ч'], ['c', 'с'], ['v', 'м'], ['b', 'и'], ['n', 'т'],
  ['m', 'ь'], [',', 'б'], ['.', 'ю'], ['/', '.'],
];

// Shift-level pairs that are not simple letter uppercasing.
const EN_TO_RU_SHIFT_PAIRS: [string, string][] = [
  ['~', 'Ё'], ['{', 'Х'], ['}', 'Ъ'], [':', 'Ж'], ['"', 'Э'],
  ['<', 'Б'], ['>', 'Ю'], ['?', ','],
  ['@', '"'], ['#', '№'], ['$', ';'], ['^', ':'], ['&', '?'],
];

function buildMaps(): { en2ru: Map<string, string>; ru2en: Map<string, string> } {
  const en2ru = new Map<string, string>();
  const ru2en = new Map<string, string>();
  for (const [en, ru] of EN_TO_RU_PAIRS) {
    en2ru.set(en, ru);
    ru2en.set(ru, en);
    // Letter keys also map at the shift level (uppercase).
    const enUp = en.toUpperCase();
    const ruUp = ru.toUpperCase();
    if (enUp !== en && ruUp !== ru) {
      en2ru.set(enUp, ruUp);
      ru2en.set(ruUp, enUp);
    }
  }
  for (const [en, ru] of EN_TO_RU_SHIFT_PAIRS) {
    if (!en2ru.has(en)) en2ru.set(en, ru);
    if (!ru2en.has(ru)) ru2en.set(ru, en);
  }
  return { en2ru, ru2en };
}

const MAPS = buildMaps();

export type LayoutDirection = 'auto' | 'en2ru' | 'ru2en';

function mapWith(text: string, map: Map<string, string>): string {
  let out = '';
  for (const ch of text) out += map.get(ch) ?? ch;
  return out;
}

/** Picks the direction that converts more characters — i.e. the direction
 *  matching the script the text was actually (mis)typed in. */
export function detectDirection(text: string): Exclude<LayoutDirection, 'auto'> {
  let latin = 0;
  let cyrillic = 0;
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) latin++;
    else if (/[а-яА-ЯёЁ]/.test(ch)) cyrillic++;
  }
  return latin >= cyrillic ? 'en2ru' : 'ru2en';
}

export function switchLayout(text: string, direction: LayoutDirection = 'auto'): string {
  const dir = direction === 'auto' ? detectDirection(text) : direction;
  return mapWith(text, dir === 'en2ru' ? MAPS.en2ru : MAPS.ru2en);
}

export function layoutSwitcherProcessor(input: string, options: OptionValues): ProcessResult {
  const direction = (options.mode as LayoutDirection) || 'auto';
  return { output: switchLayout(input, direction) };
}
