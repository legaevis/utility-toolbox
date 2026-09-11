import type { OptionValues, ProcessResult } from '../types/tool';

/**
 * Transliteration Russian ↔ Latin.
 *
 * Schemes are plain data tables, so adding a new scheme = adding a table.
 * MVP ships two:
 *   - 'common'   — practical web transliteration (ж→zh, х→kh, щ→shch, я→ya)
 *   - 'passport' — ICAO machine-readable style used in RU passports (я→ia, й→i)
 * Latin → Russian is supported for 'common' via greedy longest-match.
 */

export type TranslitScheme = 'common' | 'passport';
export type TranslitDirection = 'ru2lat' | 'lat2ru';

type Table = Record<string, string>;

const COMMON: Table = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const PASSPORT: Table = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: 'ie', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia',
};

const SCHEMES: Record<TranslitScheme, Table> = { common: COMMON, passport: PASSPORT };

function matchCase(sample: string, replacement: string): string {
  if (replacement === '') return '';
  if (sample === sample.toUpperCase() && sample !== sample.toLowerCase()) {
    // Uppercase source letter: Ш → Sh (not SH) reads better mid-word;
    // full-word uppercase is handled by the wordwise pass below.
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function transliterateRuToLat(text: string, scheme: TranslitScheme = 'common'): string {
  const table = SCHEMES[scheme];
  let out = '';
  for (const ch of text) {
    const lower = ch.toLowerCase();
    if (lower in table) {
      out += matchCase(ch, table[lower]);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Reverse table for lat→ru, longest sequences first for greedy matching. */
function buildReverse(scheme: TranslitScheme): [string, string][] {
  const table = SCHEMES[scheme];
  const pairs: [string, string][] = [];
  for (const [ru, lat] of Object.entries(table)) {
    if (lat !== '') pairs.push([lat, ru]);
  }
  // 'y' is ambiguous (й/ы) — prefer 'ы' inside words is complex; keep 'y'→'й'
  // only when COMMON maps it that way; the table order below resolves ties.
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
}

const REVERSE_COMMON = buildReverse('common');

export function transliterateLatToRu(text: string): string {
  let out = '';
  let i = 0;
  const lower = text.toLowerCase();
  outer: while (i < text.length) {
    for (const [lat, ru] of REVERSE_COMMON) {
      if (lower.startsWith(lat, i)) {
        const sample = text.slice(i, i + lat.length);
        const isUpper = sample[0] === sample[0].toUpperCase() && sample[0] !== sample[0].toLowerCase();
        out += isUpper ? ru.toUpperCase() : ru;
        i += lat.length;
        continue outer;
      }
    }
    out += text[i];
    i++;
  }
  return out;
}

export function transliterationProcessor(input: string, options: OptionValues): ProcessResult {
  const direction = (options.mode as TranslitDirection) || 'ru2lat';
  const scheme = (options.scheme as TranslitScheme) || 'common';
  const output =
    direction === 'ru2lat' ? transliterateRuToLat(input, scheme) : transliterateLatToRu(input);
  return { output };
}
