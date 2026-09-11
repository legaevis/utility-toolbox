export interface FindReplaceOptions {
  find: string;
  replaceWith: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  replaceAll?: boolean;
}

export interface FindReplaceResult {
  output: string;
  matches: number;
  replaced: number;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Word boundary that works for Cyrillic as well as Latin
 *  (JS \b only understands ASCII \w). */
function buildPattern(find: string, wholeWord: boolean): string {
  const escaped = escapeRegExp(find);
  if (!wholeWord) return escaped;
  return `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`;
}

export function findReplace(text: string, o: FindReplaceOptions): FindReplaceResult {
  const { find, replaceWith, caseSensitive = false, wholeWord = false, replaceAll = true } = o;
  if (find === '') return { output: text, matches: 0, replaced: 0 };

  const flags = `gu${caseSensitive ? '' : 'i'}`;
  const re = new RegExp(buildPattern(find, wholeWord), flags);

  const matches = [...text.matchAll(re)].length;
  if (matches === 0) return { output: text, matches: 0, replaced: 0 };

  // Replacement string is literal — "$" has no special meaning for the user.
  const literalReplacement = (): string => replaceWith;

  let replaced: number;
  let output: string;
  if (replaceAll) {
    output = text.replace(re, literalReplacement);
    replaced = matches;
  } else {
    let done = false;
    output = text.replace(re, (m) => {
      if (done) return m;
      done = true;
      return replaceWith;
    });
    replaced = 1;
  }
  return { output, matches, replaced };
}

/** Count without replacing — used for the live match counter in the UI. */
export function countMatches(
  text: string,
  find: string,
  caseSensitive = false,
  wholeWord = false,
): number {
  if (find === '') return 0;
  try {
    const re = new RegExp(buildPattern(find, wholeWord), `gu${caseSensitive ? '' : 'i'}`);
    return [...text.matchAll(re)].length;
  } catch {
    return 0;
  }
}
