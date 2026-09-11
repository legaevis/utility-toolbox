import type { OptionValues, ProcessResult } from '../types/tool';
import { joinLines, splitLines } from './lines';

export type SortMode = 'az' | 'za' | 'shortest' | 'longest' | 'numAsc' | 'numDesc';

export interface SortOptions {
  caseSensitive?: boolean;
  ignoreEmptyLines?: boolean;
  trim?: boolean;
}

const collatorSensitive = new Intl.Collator(['ru', 'en'], { sensitivity: 'variant' });
const collatorInsensitive = new Intl.Collator(['ru', 'en'], { sensitivity: 'accent' });

function numericValue(line: string): number {
  const m = line.trim().match(/-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(',', '.')) : NaN;
}

export function sortList(text: string, mode: SortMode, o: SortOptions = {}): string {
  const { caseSensitive = false, ignoreEmptyLines = true, trim = false } = o;

  let lines = splitLines(text);
  if (trim) lines = lines.map((l) => l.trim());
  if (ignoreEmptyLines) lines = lines.filter((l) => /\S/.test(l));

  const collator = caseSensitive ? collatorSensitive : collatorInsensitive;
  const sorted = [...lines];

  switch (mode) {
    case 'az':
      sorted.sort((a, b) => collator.compare(a, b));
      break;
    case 'za':
      sorted.sort((a, b) => collator.compare(b, a));
      break;
    case 'shortest':
      sorted.sort((a, b) => [...a].length - [...b].length);
      break;
    case 'longest':
      sorted.sort((a, b) => [...b].length - [...a].length);
      break;
    case 'numAsc':
    case 'numDesc': {
      // Numeric lines sort by value; non-numeric lines keep relative order at the end.
      const numeric = sorted.filter((l) => !Number.isNaN(numericValue(l)));
      const rest = sorted.filter((l) => Number.isNaN(numericValue(l)));
      numeric.sort((a, b) =>
        mode === 'numAsc' ? numericValue(a) - numericValue(b) : numericValue(b) - numericValue(a),
      );
      return joinLines([...numeric, ...rest]);
    }
  }
  return joinLines(sorted);
}

export function sortListProcessor(input: string, options: OptionValues): ProcessResult {
  const mode = (options.mode as SortMode) || 'az';
  return {
    output: sortList(input, mode, {
      caseSensitive: options.caseSensitive === true,
      ignoreEmptyLines: options.ignoreEmptyLines !== false,
      trim: options.trim === true,
    }),
  };
}
