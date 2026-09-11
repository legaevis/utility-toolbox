import type { OptionValues, ProcessResult } from '../types/tool';
import { joinLines, splitLines } from './lines';

export interface RemoveDuplicatesOptions {
  caseSensitive?: boolean;
  /** 'first' keeps the first occurrence, 'last' keeps the last. */
  keep?: 'first' | 'last';
  ignoreSurroundingSpaces?: boolean;
}

export function removeDuplicates(text: string, o: RemoveDuplicatesOptions = {}): string {
  const { caseSensitive = false, keep = 'first', ignoreSurroundingSpaces = false } = o;
  const lines = splitLines(text);

  const keyOf = (line: string): string => {
    let k = line;
    if (ignoreSurroundingSpaces) k = k.trim();
    if (!caseSensitive) k = k.toLowerCase();
    return k;
  };

  if (keep === 'first') {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const line of lines) {
      const k = keyOf(line);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(line);
      }
    }
    return joinLines(out);
  }

  // keep === 'last': keep the final occurrence, in its original position.
  const lastIndex = new Map<string, number>();
  lines.forEach((line, i) => lastIndex.set(keyOf(line), i));
  const out = lines.filter((line, i) => lastIndex.get(keyOf(line)) === i);
  return joinLines(out);
}

export function removeDuplicatesProcessor(input: string, options: OptionValues): ProcessResult {
  const before = splitLines(input).length;
  const output = removeDuplicates(input, {
    caseSensitive: options.caseSensitive === true,
    keep: options.keep === 'last' ? 'last' : 'first',
    ignoreSurroundingSpaces: options.ignoreSurroundingSpaces === true,
  });
  const after = splitLines(output).length;
  return { output, meta: { removed: before - after } };
}
