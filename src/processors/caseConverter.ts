import type { OptionValues, ProcessResult } from '../types/tool';

export type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'inverse'
  | 'capitalizeWords'
  | 'capitalizeFirst';

const WORD_RE = /[\p{L}\p{N}'’]+/gu;

function titleCaseWord(word: string): string {
  const first = [...word][0] ?? '';
  return first.toUpperCase() + word.slice(first.length).toLowerCase();
}

function capitalizeWord(word: string): string {
  const first = [...word][0] ?? '';
  return first.toUpperCase() + word.slice(first.length);
}

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(WORD_RE, titleCaseWord);
    case 'capitalizeWords':
      return text.replace(WORD_RE, capitalizeWord);
    case 'capitalizeFirst': {
      const m = text.match(/\p{L}/u);
      if (!m || m.index === undefined) return text;
      return text.slice(0, m.index) + m[0].toUpperCase() + text.slice(m.index + m[0].length);
    }
    case 'sentence': {
      const lower = text.toLowerCase();
      // Capitalize the first letter of the text and after ., !, ?, … or a line break.
      let result = '';
      let capitalizeNext = true;
      for (const ch of lower) {
        if (capitalizeNext && /\p{L}/u.test(ch)) {
          result += ch.toUpperCase();
          capitalizeNext = false;
        } else {
          result += ch;
          if (/[.!?…]/.test(ch) || ch === '\n') capitalizeNext = true;
        }
      }
      return result;
    }
    case 'inverse': {
      let out = '';
      let upper = true;
      for (const ch of text) {
        if (/\p{L}/u.test(ch)) {
          out += upper ? ch.toUpperCase() : ch.toLowerCase();
          upper = !upper;
        } else {
          out += ch;
        }
      }
      return out;
    }
  }
}

export function caseConverterProcessor(input: string, options: OptionValues): ProcessResult {
  const mode = (options.mode as CaseMode) || 'upper';
  return { output: convertCase(input, mode) };
}
