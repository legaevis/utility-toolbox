import type { OptionValues, ProcessResult } from '../types/tool';
import { protect, restore } from './typography';

/**
 * Replace Quotes: convert between straight, curly and guillemet quotes.
 * URLs, emails and code blocks are protected (same mechanism as the
 * Typography Formatter) and never modified.
 */

export type QuoteTarget = 'guillemet' | 'curly' | 'straight';

const OPENERS = ['«', '“'];
const CLOSERS = ['»', '”'];

export function replaceQuotes(text: string, target: QuoteTarget): string {
  const p = protect(text);
  let t = p.text;

  const [open, close] =
    target === 'guillemet' ? ['«', '»'] : target === 'curly' ? ['“', '”'] : ['"', '"'];

  // Existing paired typographic quotes convert directly.
  for (const o of OPENERS) t = t.split(o).join(open);
  for (const c of CLOSERS) t = t.split(c).join(close);

  // Straight quotes: position decides opening vs closing.
  if (target !== 'straight') {
    t = t.replace(/(^|[\s([{ ])"/gmu, `$1${open}`);
    t = t.replace(/"/g, close);
  }

  return restore({ text: t, tokens: p.tokens });
}

export function replaceQuotesProcessor(input: string, options: OptionValues): ProcessResult {
  const target = (options.mode as QuoteTarget) || 'guillemet';
  return { output: replaceQuotes(input, target) };
}
