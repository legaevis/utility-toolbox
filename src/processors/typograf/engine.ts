import { protect, restore } from './protect';
import { detectLanguage, type TypografLanguage } from './detect';
import { RULES, RULE_CATEGORIES, type RuleCategory } from './rules';
import { switchLayout } from '../layoutSwitcher';

/**
 * TypographyEngine — the public entry point of the Typograf.
 *
 * Pipeline (§37 of the reference spec):
 *   text → (optional keyboard-layout fix) → Unicode NFC normalization
 *        → protect(URLs/emails/HTML/code) → language detection
 *        → RULES sorted by priority (per-category toggles, per-rule
 *          try/catch, aggressive rules gated by the option)
 *        → restore → formatted text
 *
 * Contracts: fully local & synchronous (§ГЛАВНЫЙ КРИТЕРИЙ п.11), idempotent
 * (§34), never changes meaning (§38), never touches protected fragments
 * (§33), preserves paragraphs/lists/markdown (§32).
 */

export interface TypografOptions {
  /** 'auto' detects by letter counts; or force 'ru' / 'en'. */
  language?: 'auto' | TypografLanguage;
  /** Category toggles; a missing key falls back to its default. */
  categories?: Partial<Record<RuleCategory, boolean>>;
  /** Fix wrong-keyboard-layout text first (Ghbdtn → Привет). Default OFF —
   *  it rewrites letters, so the user enables it deliberately. */
  fixLayout?: boolean;
  /** «Агрессивное форматирование» (§36): deeper, style-changing transforms
   *  (12.05.2026 г. → 12 мая 2026 года; тел. → телефону; руб. → ₽).
   *  Default OFF. */
  aggressive?: boolean;
}

/** Result of a detailed run: the text plus which categories fired (§35). */
export interface TypografResult {
  text: string;
  /** How many rules of each category actually changed the text. */
  fired: Partial<Record<RuleCategory, number>>;
}

export const DEFAULT_CATEGORIES: Record<RuleCategory, boolean> = {
  quotes: true,
  dashes: true,
  spaces: true,
  punctuation: true,
  nbsp: true,
  hanging: true,
  specials: true,
  math: true,
  numbers: true,
  dates: true,
  time: true,
  currency: true,
  units: true,
  phones: true,
  numero: true,
  abbrev: true,
  yo: false, // rewrites letters — opt-in (§7)
};

export function typografDetailed(input: string, options: TypografOptions = {}): TypografResult {
  if (input === '') return { text: '', fired: {} };
  const categories = { ...DEFAULT_CATEGORIES, ...(options.categories ?? {}) };
  const aggressive = options.aggressive ?? false;

  let text = input.replace(/\r\n|\r/g, '\n');
  // §37 step 2: Unicode normalization (NFC) — combining sequences collapse
  // to canonical composed characters before any rule looks at them.
  try {
    text = text.normalize('NFC');
  } catch {
    // extremely defensive: normalize() exists everywhere we run
  }

  if (options.fixLayout) {
    text = switchLayout(text, 'auto');
  }

  const p = protect(text);
  const language: TypografLanguage =
    options.language && options.language !== 'auto' ? options.language : detectLanguage(p.text);

  const fired: Partial<Record<RuleCategory, number>> = {};
  let t = p.text;
  for (const rule of RULES) {
    if (!categories[rule.category]) continue;
    if (rule.appliesTo !== 'all' && rule.appliesTo !== language) continue;
    if (rule.aggressive && !aggressive) continue;
    try {
      const next = rule.apply(t);
      if (next !== t) fired[rule.category] = (fired[rule.category] ?? 0) + 1;
      t = next;
    } catch {
      // A single broken rule must never take the whole pipeline down.
    }
  }

  return { text: restore({ text: t, tokens: p.tokens }), fired };
}

export function typograf(input: string, options: TypografOptions = {}): string {
  return typografDetailed(input, options).text;
}

export { RULES, RULE_CATEGORIES };
export type { RuleCategory, TypografLanguage };
