/**
 * «Показать изменения» (§25) — a compact word-level diff between the source
 * text and the typografed result. Pure and dependency-free: tokenize both
 * texts into words, run an LCS, and collect every contiguous changed region
 * as a `{from, to}` pair ("Привет" → «Привет», 5-10 → 5–10 …).
 *
 * Guardrails: very large texts (over MAX_TOKENS words) return null — the UI
 * simply hides the feature instead of freezing on an O(n·m) diff.
 */

export interface ChangePair {
  from: string;
  to: string;
}

const MAX_TOKENS = 1500;
const MAX_PAIRS = 50;

function tokenize(text: string): string[] {
  // \s covers regular whitespace plus U+00A0 and U+202F (both are Zs).
  return text.split(/\s+/u).filter((w) => w !== '');
}

export function diffChanges(source: string, result: string): ChangePair[] | null {
  const a = tokenize(source);
  const b = tokenize(result);
  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) return null;

  // LCS table (lengths only) — small texts, so the O(n·m) cost is fine.
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = [];
  for (let i = 0; i <= n; i++) dp.push(new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const pairs: ChangePair[] = [];
  let i = 0;
  let j = 0;
  let removed: string[] = [];
  let added: string[] = [];
  const flush = () => {
    if (removed.length > 0 || added.length > 0) {
      pairs.push({ from: removed.join(' '), to: added.join(' ') });
      removed = [];
      added = [];
    }
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      removed.push(a[i++]);
    } else {
      added.push(b[j++]);
    }
  }
  while (i < n) removed.push(a[i++]);
  while (j < m) added.push(b[j++]);
  flush();

  return pairs.slice(0, MAX_PAIRS);
}
