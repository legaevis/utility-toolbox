import type { OptionValues, ProcessResult } from '../types/tool';
import { joinLines } from './lines';

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// URLs with an explicit scheme, plus bare www. links.
const URL_RE = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"'()\[\]{}]+/gi;

/** Trailing punctuation that is almost always sentence punctuation,
 *  not part of the URL: "see https://example.com." */
function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?…]+$/, '');
}

export function extractEmails(text: string): string[] {
  return text.match(EMAIL_RE) ?? [];
}

export function extractUrls(text: string): string[] {
  return (text.match(URL_RE) ?? []).map(stripTrailingPunctuation);
}

export type ExtractKind = 'emails' | 'urls' | 'both';

export function extract(text: string, kind: ExtractKind, dedupe: boolean): string[] {
  let items: string[] = [];
  if (kind === 'emails') items = extractEmails(text);
  else if (kind === 'urls') items = extractUrls(text);
  else {
    // "both": emails first, then URLs that are not just an email's domain match.
    const emails = extractEmails(text);
    const urls = extractUrls(text);
    items = [...emails, ...urls];
  }
  if (dedupe) {
    const seen = new Set<string>();
    items = items.filter((i) => {
      const k = i.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  return items;
}

export function extractorProcessor(input: string, options: OptionValues): ProcessResult {
  const kind = (options.mode as ExtractKind) || 'both';
  const items = extract(input, kind, options.dedupe !== false);
  return { output: joinLines(items), meta: { found: items.length } };
}
