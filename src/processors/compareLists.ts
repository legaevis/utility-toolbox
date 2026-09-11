import { splitLines } from './lines';

export interface CompareOptions {
  caseSensitive?: boolean;
  trim?: boolean;
  ignoreEmptyLines?: boolean;
}

export interface CompareResult {
  common: string[];
  onlyA: string[];
  onlyB: string[];
  /** Every distinct item across both lists. */
  unique: string[];
}

export function compareLists(a: string, b: string, o: CompareOptions = {}): CompareResult {
  const { caseSensitive = false, trim = true, ignoreEmptyLines = true } = o;

  const keyOf = (line: string): string => (caseSensitive ? line : line.toLowerCase());

  const prepare = (text: string): { key: string; display: string }[] => {
    let lines = splitLines(text);
    if (trim) lines = lines.map((l) => l.trim());
    if (ignoreEmptyLines) lines = lines.filter((l) => /\S/.test(l));
    // Dedupe within each list, preserving first occurrence for display.
    const seen = new Set<string>();
    const out: { key: string; display: string }[] = [];
    for (const line of lines) {
      const k = keyOf(line);
      if (!seen.has(k)) {
        seen.add(k);
        out.push({ key: k, display: line });
      }
    }
    return out;
  };

  const listA = prepare(a);
  const listB = prepare(b);
  const keysA = new Set(listA.map((x) => x.key));
  const keysB = new Set(listB.map((x) => x.key));

  const common = listA.filter((x) => keysB.has(x.key)).map((x) => x.display);
  const onlyA = listA.filter((x) => !keysB.has(x.key)).map((x) => x.display);
  const onlyB = listB.filter((x) => !keysA.has(x.key)).map((x) => x.display);
  const unique = [...listA, ...listB.filter((x) => !keysA.has(x.key))].map((x) => x.display);

  return { common, onlyA, onlyB, unique };
}
