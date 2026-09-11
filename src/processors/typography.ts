import type { OptionValues, ProcessResult } from '../types/tool';

/**
 * Typography Formatter.
 *
 * Every transform runs over "safe" text only: URLs, emails, inline code
 * (`...`) and fenced code blocks (``` ... ```) are extracted into
 * placeholders first and restored untouched at the end.
 */

export interface TypographyOptions {
  quotes?: boolean;
  /** 'guillemet' → «…», 'curly' → “…” */
  quoteStyle?: 'guillemet' | 'curly';
  dashes?: boolean;
  spaces?: boolean;
  nbsp?: boolean;
}

const PLACEHOLDER = '\uE000';

export interface Protected {
  text: string;
  tokens: string[];
}

const PROTECT_RE = new RegExp(
  [
    '```[\\s\\S]*?```', // fenced code blocks
    '`[^`\\n]*`', // inline code
    '(?:https?:\\/\\/|ftp:\\/\\/|www\\.)[^\\s<>"«»]+', // URLs
    "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", // emails
  ].join('|'),
  'g',
);

export function protect(text: string): Protected {
  const tokens: string[] = [];
  const out = text.replace(PROTECT_RE, (m) => {
    tokens.push(m);
    return `${PLACEHOLDER}${tokens.length - 1}${PLACEHOLDER}`;
  });
  return { text: out, tokens };
}

export function restore(p: Protected): string {
  return p.text.replace(new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, 'g'), (_, i) => p.tokens[Number(i)]);
}

function applyQuotes(t: string, style: 'guillemet' | 'curly'): string {
  const [open, close] = style === 'guillemet' ? ['«', '»'] : ['“', '”'];
  // Opening: after start/whitespace/opening bracket; closing otherwise.
  t = t.replace(/(^|[\s([{ ])"/gmu, `$1${open}`);
  t = t.replace(/"/g, close);
  // Same for single quotes used as quotation marks is intentionally NOT done:
  // apostrophes (it's, д'Артаньян) make it too risky for an MVP.
  return t;
}

function applyDashes(t: string): string {
  // Double/triple hyphen → em dash.
  t = t.replace(/---?/g, '—');
  // Space-surrounded hyphen → em dash (ru style " — ").
  t = t.replace(/(^|[^\S\n])-(?=\s)/gmu, '$1—');
  // Digit range: 5-10 → 5–10 (en dash). Avoid dates like 2024-08-13 (two hyphens).
  t = t.replace(/(?<![\d-])(\d+)-(\d+)(?![\d-])/g, '$1–$2');
  return t;
}

function applySpaces(t: string): string {
  // Collapse multiple spaces (not across line breaks).
  t = t.replace(/[ \t]{2,}/g, ' ');
  // No space before punctuation, one space after (when followed by a letter/digit).
  t = t.replace(/[ \t]+([,.;:!?…])/g, '$1');
  t = t.replace(/([,.;:!?…])(?=[\p{L}\p{N}])/gu, '$1 ');
  // Trim trailing whitespace on each line.
  t = t.replace(/[ \t]+$/gm, '');
  return t;
}

function applyNbsp(t: string): string {
  const NBSP = '\u00A0';
  // After short (1–2 letter) words — prepositions and conjunctions: "в лесу" → "в лесу".
  t = t.replace(/(^|[\s («"])(\p{L}{1,2})[ \t]+(?=[\p{L}\p{N}«"(])/gmu, `$1$2${NBSP}`);
  // Between a number and the following word: "5 штук" → "5 штук".
  t = t.replace(/(\d)[ \t]+(?=\p{L})/gu, `$1${NBSP}`);
  // Before an em dash: "текст —" → "текст —".
  t = t.replace(/[ \t]+—/g, `${NBSP}—`);
  return t;
}

export function formatTypography(text: string, o: TypographyOptions = {}): string {
  const { quotes = true, quoteStyle = 'guillemet', dashes = true, spaces = true, nbsp = false } = o;
  const p = protect(text);
  let t = p.text;
  if (spaces) t = applySpaces(t);
  if (quotes) t = applyQuotes(t, quoteStyle);
  if (dashes) t = applyDashes(t);
  if (nbsp) t = applyNbsp(t);
  return restore({ text: t, tokens: p.tokens });
}

export function typographyProcessor(input: string, options: OptionValues): ProcessResult {
  return {
    output: formatTypography(input, {
      quotes: options.quotes !== false,
      quoteStyle: options.quoteStyle === 'curly' ? 'curly' : 'guillemet',
      dashes: options.dashes !== false,
      spaces: options.spaces !== false,
      nbsp: options.nbsp === true,
    }),
  };
}
