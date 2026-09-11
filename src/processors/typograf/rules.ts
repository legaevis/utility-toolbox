import type { TypografLanguage } from './detect';

/**
 * Rule Engine of the Typograf (reference spec: «Эталонные правила
 * типографирования», sections 1–40).
 *
 * Every rule is an independent, pure, CONTEXT-AWARE transform:
 *   - id        — unique, dot-namespaced;
 *   - name      — short human-readable label (docs live in TYPOGRAPHY.md);
 *   - category  — what the user toggles in the tool's settings;
 *   - appliesTo — language guard ('ru' | 'en' | 'all');
 *   - priority  — lower runs first; RULES is exported sorted by priority,
 *                 so the pipeline is deterministic (§37);
 *   - aggressive — rule fires ONLY when «Агрессивное форматирование» is on
 *                 (§36: transformations that change editorial style);
 *   - apply     — the transform. MUST be idempotent (§34) and MUST NOT
 *                 change meaning (§38). Operates on protected text — URLs,
 *                 emails, HTML and code are already tokenized (§33).
 *
 * The main principle (§38): change the FORM, never the MEANING. No blind
 * global replaces — every transform checks its context.
 */

export type RuleCategory =
  | 'quotes'
  | 'dashes'
  | 'spaces'
  | 'nbsp'
  | 'hanging'
  | 'punctuation'
  | 'specials'
  | 'math'
  | 'numbers'
  | 'dates'
  | 'time'
  | 'currency'
  | 'units'
  | 'phones'
  | 'numero'
  | 'abbrev'
  | 'yo';

export interface Rule {
  id: string;
  name: string;
  category: RuleCategory;
  appliesTo: TypografLanguage | 'all';
  priority: number;
  aggressive?: boolean;
  apply: (text: string) => string;
}

const NBSP = '\u00A0';
const NNBSP = '\u202F'; // narrow no-break space (digit grouping)

// ---------------------------------------------------------------------------
// Spaces (priority 100–199) — §2, §3, §4, §5, §24, §25
// ---------------------------------------------------------------------------

const spaceRules: Rule[] = [
  {
    id: 'space.bom',
    name: 'Strip BOM / zero-width chars',
    category: 'spaces',
    appliesTo: 'all',
    priority: 100,
    apply: (t) => t.replace(/\uFEFF/g, ''),
  },
  {
    id: 'space.tabs',
    name: 'Tabs to spaces',
    category: 'spaces',
    appliesTo: 'all',
    priority: 105,
    apply: (t) => t.replace(/\t/g, ' '),
  },
  {
    id: 'space.collapse',
    name: 'Collapse repeated spaces',
    category: 'spaces',
    appliesTo: 'all',
    priority: 110,
    apply: (t) => t.replace(/ {2,}/g, ' '),
  },
  {
    id: 'space.lineEdges',
    name: 'Trim line edges',
    category: 'spaces',
    appliesTo: 'all',
    priority: 115,
    apply: (t) => t.replace(/[ \u00A0]+$/gm, '').replace(/^ +/gm, ''),
  },
  {
    id: 'space.unwrapLines',
    name: 'Join a formatting line break inside a sentence with a space',
    category: 'spaces',
    appliesTo: 'all',
    priority: 118,
    // A hard-wrapped paragraph line (≥ 40 chars, ends mid-sentence with a
    // lowercase letter or comma) followed by a line starting with a
    // lowercase letter is ONE sentence — the break is formatting, join with
    // a space (never gluing words together). Everything structural is
    // untouched by construction: paragraphs (empty line between), headings
    // and list items (start with #/-/*/digit/uppercase), short lines
    // (poetry, word-per-line lists — under the length threshold), lines
    // ending with .!?…: and hyphenated word breaks (end with «-»).
    apply: (t) => {
      const lines = t.split('\n');
      const out: string[] = [];
      for (const line of lines) {
        const prev = out.length > 0 ? out[out.length - 1] : undefined;
        if (
          prev !== undefined &&
          prev.length >= 40 &&
          /[\p{Ll},]$/u.test(prev) &&
          /^\p{Ll}/u.test(line)
        ) {
          out[out.length - 1] = `${prev} ${line}`;
        } else {
          out.push(line);
        }
      }
      return out.join('\n');
    },
  },
  {
    id: 'space.newlines',
    name: 'Collapse 3+ newlines (paragraphs survive, §32)',
    category: 'spaces',
    appliesTo: 'all',
    priority: 120,
    apply: (t) => t.replace(/\n{3,}/g, '\n\n'),
  },
  {
    id: 'space.beforePunct',
    name: 'No space before punctuation (§2)',
    category: 'spaces',
    appliesTo: 'all',
    priority: 125,
    apply: (t) => t.replace(/[ \u00A0]+([,.;:!?…])/g, '$1'),
  },
  {
    id: 'space.afterPunct',
    name: 'Space after punctuation (§3; guards 12,5 / 9:00)',
    category: 'spaces',
    appliesTo: 'all',
    priority: 130,
    // NOT after "." (decimals, versions, abbreviations) and NOT inside
    // "12,5" — the decimal comma must survive re-runs (idempotency).
    apply: (t) =>
      t
        .replace(/([;!?…])(?=[\p{L}\p{N}])/gu, '$1 ')
        .replace(/,(?=\p{L})/gu, ', ')
        .replace(/(?<!\d),(?=\d)/gu, ', '),
  },
  {
    id: 'space.afterDot',
    name: 'Space after sentence dot (lower.Upper only)',
    category: 'spaces',
    appliesTo: 'all',
    priority: 132,
    // "отдыха.Формула" → "отдыха. Формула". Lowercase letter before the dot
    // + capital right after ⇒ sentence boundary. Never fires on decimals
    // (digits), initials (А.С. — capital before dot), т.д. (lowercase after).
    apply: (t) => t.replace(/(\p{Ll})\.(?=\p{Lu})/gu, '$1. '),
  },
  {
    id: 'space.colon',
    name: 'Space after colon between letters (9:00 intact, §3)',
    category: 'spaces',
    appliesTo: 'all',
    priority: 135,
    apply: (t) => t.replace(/(\p{L}):(?=\p{L})/gu, '$1: '),
  },
  {
    id: 'space.brackets',
    name: 'Brackets: ( текст ) → (текст) (§24)',
    category: 'spaces',
    appliesTo: 'all',
    priority: 140,
    apply: (t) =>
      t
        .replace(/\( +/g, '(')
        .replace(/ +\)/g, ')')
        .replace(/\[ +/g, '[')
        .replace(/ +\]/g, ']')
        .replace(/(\p{L})\(/gu, '$1 ('),
  },
  {
    id: 'space.insideQuotes',
    name: '« текст » → «текст» (spaces inside quotes)',
    category: 'spaces',
    appliesTo: 'all',
    priority: 142,
    apply: (t) =>
      t
        .replace(/«[ \u00A0]+/g, '«')
        .replace(/[ \u00A0]+»/g, '»')
        .replace(/“[ \u00A0]+/g, '“')
        .replace(/[ \u00A0]+”/g, '”'),
  },
  {
    id: 'space.percent.ru',
    name: '5% → 5 % (nbsp between number and %, ru norm)',
    category: 'spaces',
    appliesTo: 'ru',
    priority: 145,
    // Russian typography: a non-breaking space between the number and %.
    apply: (t) => t.replace(/(\d)[ \u00A0]*%/g, `$1${NBSP}%`),
  },
  {
    id: 'space.percent.en',
    name: '5 % → 5% (no space before %, en)',
    category: 'spaces',
    appliesTo: 'en',
    priority: 146,
    // English typography keeps the % sign tight to the number.
    apply: (t) => t.replace(/(\d)[ \u00A0]+%/g, '$1%'),
  },
];

// ---------------------------------------------------------------------------
// Punctuation (200–299) — §21, §29
// ---------------------------------------------------------------------------

const punctuationRules: Rule[] = [
  {
    id: 'punct.ellipsis',
    name: '... → … (3+ dots, §21)',
    category: 'punctuation',
    appliesTo: 'all',
    priority: 200,
    apply: (t) => t.replace(/\.{3,}/g, '…'),
  },
  {
    id: 'punct.doubleDot',
    name: 'мес.. → мес. (exactly two dots, §29 — NOT the ellipsis)',
    category: 'punctuation',
    appliesTo: 'all',
    priority: 205,
    apply: (t) => t.replace(/(\p{L})\.\.(?!\.)/gu, '$1.'),
  },
  {
    id: 'punct.double',
    name: 'Collapse !! ?? ,, ;; and !? → ?!',
    category: 'punctuation',
    appliesTo: 'all',
    priority: 210,
    apply: (t) =>
      t
        .replace(/!{2,}/g, '!')
        .replace(/\?{2,}/g, '?')
        .replace(/!\?/g, '?!')
        .replace(/,{2,}/g, ',')
        .replace(/;{2,}/g, ';'),
  },
  {
    id: 'punct.combos',
    name: '?… → ?.. / !… → !.. / …, → …',
    category: 'punctuation',
    appliesTo: 'all',
    priority: 215,
    apply: (t) => t.replace(/\?…/g, '?..').replace(/!…/g, '!..').replace(/…,/g, '…'),
  },
  {
    id: 'punct.listDot',
    name: '«2.Пункт» → «2. Пункт» (numbered list marker at line start)',
    category: 'punctuation',
    appliesTo: 'all',
    priority: 217,
    // Missing space after a list-number dot — line start only, letter after
    // the dot (decimals «1.5» and versions have a digit and never match).
    apply: (t) => t.replace(/^(\d{1,3})\.(?=\p{L})/gmu, '$1. '),
  },
  {
    id: 'punct.wordRepeat.ru',
    name: '«в в тексте» → «в тексте» (doubled service words only)',
    category: 'punctuation',
    appliesTo: 'ru',
    priority: 218,
    // Only unambiguous SERVICE words — «очень очень» and other meaningful
    // repeats are left alone (§28: safety first).
    apply: (t) =>
      t.replace(
        /(?<![\p{L}])(в|и|на|не|с|по|за|к|у|о|а|но|да|то|же|ли|бы|от|до|из|под|над|при|без|про|для) \1(?![\p{L}])/gu,
        '$1',
      ),
  },
  {
    id: 'punct.apostrophe',
    name: "it's → it’s (between letters only)",
    category: 'punctuation',
    appliesTo: 'all',
    priority: 220,
    apply: (t) => t.replace(/(\p{L})'(?=\p{L})/gu, '$1’'),
  },
];

// ---------------------------------------------------------------------------
// Quotes (300–399) — §1: language-aware, one nesting level, context-guarded
// (quotes inside code/HTML/URLs are protected upstream)
// ---------------------------------------------------------------------------

function smartQuotes(t: string, open: string, close: string, innerOpen: string, innerClose: string): string {
  t = t.replace(/(^|[\s(\[{›»—–-])"/gmu, `$1${open}`);
  t = t.replace(/"/g, close);
  // One nesting level: «а «б» в» → «а „б“ в»
  let result = '';
  let depth = 0;
  for (const ch of t) {
    if (ch === open) {
      depth++;
      result += depth > 1 ? innerOpen : open;
    } else if (ch === close) {
      result += depth > 1 ? innerClose : close;
      if (depth > 0) depth--;
    } else {
      result += ch;
    }
  }
  return result;
}

const quoteRules: Rule[] = [
  {
    id: 'quotes.ru.double',
    name: '"текст" → «текст» (§1)',
    category: 'quotes',
    appliesTo: 'ru',
    priority: 300,
    apply: (t) => smartQuotes(t, '«', '»', '„', '“'),
  },
  {
    id: 'quotes.ru.single',
    name: "'текст' → «текст» (paired straight singles, ru)",
    category: 'quotes',
    appliesTo: 'ru',
    priority: 305,
    // Paired straight single quotes around a phrase → guillemets.
    // Apostrophes inside words (д'Артаньян) never match — the opening
    // quote must follow a boundary and the closing one must precede one.
    apply: (t) =>
      t.replace(/(^|[\s(«\[])'([^'\n]{1,60}?)'(?=[\s).,;:!?\]»…]|$)/gmu, '$1«$2»'),
  },
  {
    id: 'quotes.angular.ru',
    name: '<<текст>> → «текст»',
    category: 'quotes',
    appliesTo: 'ru',
    priority: 302,
    apply: (t) => t.replace(/<<([^<>\n]{1,200}?)>>/g, '«$1»'),
  },
  {
    id: 'quotes.curly.ru',
    name: '“текст” → «текст» (ru text uses guillemets)',
    category: 'quotes',
    appliesTo: 'ru',
    priority: 303,
    apply: (t) => t.replace(/“([^“”\n]{1,200}?)”/g, '«$1»'),
  },
  {
    id: 'quotes.dedupe',
    name: '«« → «, »» → » (duplicated quotes)',
    category: 'quotes',
    appliesTo: 'all',
    // BEFORE smartQuotes (300): adjacent doubles are noise, not nesting.
    priority: 299,
    apply: (t) => t.replace(/«{2,}/g, '«').replace(/»{2,}/g, '»'),
  },
  {
    id: 'quotes.en.double',
    name: '"text" → “text”',
    category: 'quotes',
    appliesTo: 'en',
    priority: 310,
    apply: (t) => smartQuotes(t, '“', '”', '‘', '’'),
  },
  {
    id: 'quotes.en.single',
    name: "'text' → ‘text’ (paired straight singles, en)",
    category: 'quotes',
    appliesTo: 'en',
    priority: 315,
    // Paired straight single quotes around a phrase → curly singles.
    // Apostrophes (it's, don't) are converted to ’ earlier by
    // punct.apostrophe (between letters only), so they never pair here:
    // the opening quote must follow a boundary and the closing one must
    // precede one.
    apply: (t) =>
      t.replace(/(^|[\s(“\[])'([^'\n]{1,60}?)'(?=[\s).,;:!?\]”…]|$)/gmu, '$1‘$2’'),
  },
];

// ---------------------------------------------------------------------------
// Special symbols (400–449) — ©®™, arrows, °C, м², №№
// ---------------------------------------------------------------------------

// Common chemical formulas (longest first so H2O2 wins over H2O).
const CHEM_RE = new RegExp('\\b(?:' + 'C6H12O6|C2H5OH|Na2CO3|NaHCO3|H2SO4|H2CO3|H3PO4|C4H10|CaCO3|CaCl2|Fe2O3|Fe3O4|Al2O3|CuSO4|KMnO4|MgSO4|H2O2|HNO3|C2H2|C2H4|C2H6|C3H8|C6H6|NaCl|NaOH|SiO2|P2O5|TiO2|H2O|CO2|SO2|SO3|NO2|N2O|Cl2|CH4|NH3|NH4|KOH|CaO|ZnO|MgO|K2O|N2|O2|O3|H2' + ')\\b', 'g');

const specialRules: Rule[] = [
  {
    id: 'special.signs',
    name: '(c)/(r)/(tm) → © ® ™',
    category: 'specials',
    appliesTo: 'all',
    priority: 400,
    apply: (t) =>
      t
        .replace(/\(c\)/gi, '©')
        .replace(/\(с\)/gi, '©') // cyrillic с typed as copyright
        .replace(/\(r\)/gi, '®')
        .replace(/\(tm\)/gi, '™'),
  },
  {
    id: 'special.redundantSign',
    name: '© (c) → © (textual marker next to the glyph is redundant)',
    category: 'specials',
    appliesTo: 'all',
    // AFTER special.signs (400) AND math.plusminus (460): by then «© (с)»
    // is «© ©» and «± +/-» is «± ±» — ready to collapse.
    priority: 482,
    // Runs right after special.signs (400), which has already converted the
    // textual markers — «© (с) Компания» is «© © Компания» by now. Repeated
    // glyphs collapse to one; «₽ руб.» and «$ $» duplicates clean up too.
    apply: (t) =>
      t
        .replace(/([©®™±])(?:[ \u00A0]*\1)+/g, '$1')
        .replace(/\$(?:[ \u00A0]*\$)+/g, () => '$')
        .replace(/₽[ \u00A0]*руб\.?(?![\p{L}])/gu, '₽')
        .replace(/руб\.?[ \u00A0]*₽/g, '₽'),
  },
  {
    id: 'special.arrows',
    name: '-> → →, <- → ←, <-> → ↔, => → ⇒',
    category: 'specials',
    appliesTo: 'all',
    priority: 405,
    apply: (t) => t.replace(/<->/g, '↔').replace(/->/g, '→').replace(/<-/g, '←').replace(/=>/g, '⇒'),
  },
  {
    id: 'special.degrees',
    name: '25° C → 25 °C (latin C/F and cyrillic С)',
    category: 'specials',
    appliesTo: 'all',
    priority: 410,
    apply: (t) => t.replace(/(\d)[ \u00A0]*°[ \u00A0]*([CFС])/g, `$1${NBSP}°$2`),
  },
  {
    id: 'special.sqm',
    name: 'м2/м3 → м²/м³ after a number',
    category: 'specials',
    appliesTo: 'all',
    priority: 415,
    apply: (t) =>
      t
        .replace(/(\d[ \u00A0]?)(м|m)2(?!\d)/g, '$1$2²')
        .replace(/(\d[ \u00A0]?)(м|m)3(?!\d)/g, '$1$2³'),
  },
  {
    id: 'special.chemFormula',
    name: 'H2O → H₂O (chemical formulas, whitelist only)',
    category: 'specials',
    appliesTo: 'all',
    priority: 418,
    // ONLY a whitelist of common formulas — B2B, A4, MP3, C3PO and other
    // letter-digit tokens must never be touched (§38: when in doubt, skip).
    apply: (t) => {
      const SUB: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      };
      return t.replace(CHEM_RE, (m) => m.replace(/\d/g, (d) => SUB[d] ?? d));
    },
  },
  {
    id: 'special.numeroDouble',
    name: '№№ → №, г.г. → гг.',
    category: 'specials',
    appliesTo: 'ru',
    priority: 420,
    apply: (t) => t.replace(/№{2,}/g, '№').replace(/(г)\.г\./g, '$1г.'),
  },
];

// ---------------------------------------------------------------------------
// Math (450–499) — §22, §23: operators and readable expressions.
// Operands are guarded to SINGLE letters/digits so identifiers like Ctrl+C
// or code-ish tokens are never reformatted (§23: no formatting of code).
// ---------------------------------------------------------------------------

const mathRules: Rule[] = [
  {
    id: 'math.compare',
    name: '>= ≤ != (spaces tolerated: "> =" → ≥, §22)',
    category: 'math',
    appliesTo: 'all',
    priority: 450,
    apply: (t) =>
      t
        .replace(/<[ \u00A0]?=/g, '≤')
        .replace(/>[ \u00A0]?=/g, '≥')
        .replace(/!=/g, '≠')
        .replace(/~=/g, '≈'),
  },
  {
    id: 'math.plusminus',
    name: '+- / +\u2044- → ±',
    category: 'math',
    appliesTo: 'all',
    priority: 460,
    apply: (t) => t.replace(/\+\/-/g, '±').replace(/\+-/g, '±'),
  },
  {
    id: 'math.multiplyX',
    name: '10 x 5 → 10 × 5 (latin/cyrillic x between numbers)',
    category: 'math',
    appliesTo: 'all',
    priority: 465,
    apply: (t) => t.replace(/(\d)[ \u00A0]*[xх][ \u00A0]*(\d)/g, `$1${NBSP}×${NBSP}$2`),
  },
  {
    id: 'math.multiplyStar',
    name: 'b*c → b × c (single-char operands only, §22)',
    category: 'math',
    appliesTo: 'all',
    priority: 470,
    apply: (t) =>
      t.replace(
        /(?<![\p{L}\p{N}])([\p{L}\p{N}])[ \u00A0]*\*[ \u00A0]*([\p{L}\p{N}])(?![\p{L}\p{N}])/gu,
        '$1 × $2',
      ),
  },
  {
    id: 'math.plusSpacing',
    name: 'c+d → c + d (single-char operands; Ctrl+C intact)',
    category: 'math',
    appliesTo: 'all',
    priority: 475,
    apply: (t) =>
      t.replace(/(?<![\p{L}\p{N}])([\p{L}\p{N}])\+([\p{L}\p{N}])(?![\p{L}\p{N}])/gu, '$1 + $2'),
  },
  {
    id: 'math.equalsSpacing',
    name: 'A=b → A = b (single-char operands, §23)',
    category: 'math',
    appliesTo: 'all',
    priority: 480,
    apply: (t) =>
      t.replace(
        /(?<![\p{L}\p{N}=])([\p{L}\p{N}])[ \u00A0]*=[ \u00A0]*([\p{L}\p{N}])(?![\p{L}\p{N}=])/gu,
        '$1 = $2',
      ),
  },
];

// ---------------------------------------------------------------------------
// Dates (500–549) — §8, §9: convert only UNAMBIGUOUS dates; expansion to
// words is aggressive-only. Versions/IPs/decimals are guarded.
// ---------------------------------------------------------------------------

const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const MONTHS_RU =
  'января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь';
const DAYS_RU =
  'понедельник|вторник|среда|четверг|пятница|суббота|воскресенье|понедельника|вторника|среды|четверга|пятницы|субботы|воскресенья';

const dateRules: Rule[] = [
  {
    id: 'date.iso.ru',
    name: 'ISO 2026-08-25 → 25.08.2026 (ru)',
    category: 'dates',
    appliesTo: 'ru',
    priority: 500,
    apply: (t) => t.replace(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g, '$3.$2.$1'),
  },
  {
    id: 'date.rangeDays.ru',
    name: '«с 25.08 по 31.08.2026» → «с 25 по 31 августа 2026 года» (aggressive, §10.1)',
    category: 'dates',
    appliesTo: 'ru',
    priority: 502,
    aggressive: true,
    apply: (t) =>
      t.replace(
        /(^|[\s(«])с[ \u00A0](\d{1,2})\.([01]\d)[ \u00A0]по[ \u00A0](\d{1,2})\.([01]\d)(?:\.((?:19|20)\d\d))?(?!\.?\d)/g,
        (m, pre: string, d1: string, m1: string, d2: string, m2: string, y?: string) => {
          const mo1 = Number(m1);
          const mo2 = Number(m2);
          const day1 = Number(d1);
          const day2 = Number(d2);
          if (mo1 < 1 || mo1 > 12 || mo2 < 1 || mo2 > 12 || day1 < 1 || day1 > 31 || day2 < 1 || day2 > 31) return m;
          const tail = y ? ` ${y}${NBSP}года` : '';
          if (mo1 === mo2) return `${pre}с ${day1} по ${day2} ${MONTHS_GEN[mo2 - 1]}${tail}`;
          return `${pre}с ${day1} ${MONTHS_GEN[mo1 - 1]} по ${day2} ${MONTHS_GEN[mo2 - 1]}${tail}`;
        },
      ),
  },
  {
    id: 'date.yearRange.ru',
    name: '«с 2020-2026 гг.» → «с 2020 по 2026 год» (aggressive, §10.2)',
    category: 'dates',
    appliesTo: 'ru',
    priority: 503,
    aggressive: true,
    apply: (t) =>
      t.replace(
        /(^|[\s(«])с[ \u00A0]((?:19|20)\d\d)[-–][ \u00A0]?((?:19|20)\d\d)[ \u00A0]*(?:гг?\.|годы|годов|год)?(?![\p{L}\d])/gu,
        '$1с $2 по $3 год',
      ),
  },
  {
    id: 'date.expand.ru',
    name: '12.05.2026 [г.] → 12 мая 2026 года (aggressive, §9)',
    category: 'dates',
    appliesTo: 'ru',
    priority: 505,
    aggressive: true,
    // Only unambiguous DD.MM.YYYY with a real month/day; a latin word right
    // before it ("version 12.05.2026") marks a technical context — skip.
    apply: (t) =>
      t.replace(
        /(?<![\d.])(?<![A-Za-z][ \u00A0])([0-3]?\d)\.([01]\d)\.((?:19|20)\d\d)(?!\d)((?:[ \u00A0]*г(?:ода|\.)?)?)/g,
        (m, d: string, mo: string, y: string) => {
          const day = Number(d);
          const month = Number(mo);
          if (day < 1 || day > 31 || month < 1 || month > 12) return m;
          return `${day}${NBSP}${MONTHS_GEN[month - 1]} ${y}${NBSP}года`;
        },
      ),
  },
  {
    id: 'date.monthCase.ru',
    name: '2 Мая → 2 мая',
    category: 'dates',
    appliesTo: 'ru',
    priority: 510,
    apply: (t) =>
      t.replace(
        new RegExp(`(\\d[ \\u00A0])(${MONTHS_RU.replace(/(^|\|)(.)/g, (_, b, c) => `${b}${c.toUpperCase()}`)})`, 'g'),
        (_, pre, month) => `${pre}${month.toLowerCase()}`,
      ),
  },
  {
    id: 'date.dayCase.ru',
    name: ', Понедельник → , понедельник',
    category: 'dates',
    appliesTo: 'ru',
    priority: 515,
    apply: (t) =>
      t.replace(
        new RegExp(`(,[ \\u00A0])(${DAYS_RU.replace(/(^|\|)(.)/g, (_, b, c) => `${b}${c.toUpperCase()}`)})`, 'g'),
        (_, pre, day) => `${pre}${day.toLowerCase()}`,
      ),
  },
  {
    id: 'date.capitalize.en',
    name: 'monday → Monday (weekdays + unambiguous months)',
    category: 'dates',
    appliesTo: 'en',
    priority: 516,
    // march / may / august are ordinary words too — left alone (§28).
    apply: (t) =>
      t.replace(
        /(?<![\p{L}])(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|september|october|november|december)(?![\p{L}])/gu,
        (m) => m[0].toUpperCase() + m.slice(1),
      ),
  },
];

// ---------------------------------------------------------------------------
// Time (550–599) — §16, §17. Conservative: only "-00" converts (5-10 must
// stay a numeric range).
// ---------------------------------------------------------------------------

const timeRules: Rule[] = [
  {
    id: 'time.hyphen',
    name: '9-00 → 9:00 (minutes "00" only, §16)',
    category: 'time',
    appliesTo: 'all',
    priority: 550,
    // Trailing "." / "," are ordinary sentence punctuation — only chars
    // that would continue a number/range/time block the match.
    apply: (t) => t.replace(/(?<![\d:.,–—-])([01]?\d|2[0-3])-00(?![\d:–—-])/g, '$1:00'),
  },
  {
    id: 'time.range',
    name: '9:00 - 18:00 → 9:00–18:00 (§17)',
    category: 'time',
    appliesTo: 'all',
    priority: 555,
    apply: (t) =>
      t.replace(/(\d{1,2}:\d{2})[ \u00A0]*[-–—][ \u00A0]*(\d{1,2}:\d{2})/g, '$1–$2'),
  },
];

// ---------------------------------------------------------------------------
// Dashes (600–649) — §6: NEVER a blind "-"→"—"; hyphens inside words
// (из-за, кто-то, 50-летний) are untouched by design of the patterns.
// ---------------------------------------------------------------------------

const dashRules: Rule[] = [
  {
    id: 'dash.double',
    name: '-- → —',
    category: 'dashes',
    appliesTo: 'all',
    priority: 600,
    apply: (t) => t.replace(/(^|[^-])---?(?!-)/gm, (_, p) => `${p}—`),
  },
  {
    id: 'dash.directSpeech',
    name: '"- Привет" → "— Привет" (line start; markdown lists intact, §32)',
    category: 'dashes',
    appliesTo: 'ru',
    priority: 605,
    // A run of 2+ adjacent "- " lines is a markdown bullet list — skipped.
    apply: (t) => {
      const lines = t.split('\n');
      const isDash = lines.map((l) => /^- /.test(l));
      return lines
        .map((l, i) => (isDash[i] && !isDash[i - 1] && !isDash[i + 1] ? l.replace(/^- /, '— ') : l))
        .join('\n');
    },
  },
  {
    id: 'dash.spacedRange',
    name: '$10.50 – $20.00 → $10.50–$20.00 (spaced dash between numbers is a range)',
    category: 'dashes',
    appliesTo: 'all',
    priority: 608,
    // A dash with spaces BETWEEN two numbers (optionally with a currency
    // prefix or a % suffix) is a range: en dash, no spaces. Runs before the
    // sentence-dash rules (610/615) so they never see it. A prose em dash
    // («итого — 5», "1999 — a great year") has a word on one side and is
    // untouched. «с 2020 — 2026» is a «с … по …» construction — left for
    // the aggressive dates rule, same guard as dash.range.
    apply: (t) =>
      t.replace(
        /([$€£¥₽₺₴₸]?\d(?:[\d.,]*\d)?(?:[ \u00A0]?%)?)[ \u00A0][-–—][ \u00A0](?=[$€£¥₽₺₴₸]?\d)/g,
        (m, a: string, off: number, str: string) => {
          if (/(^|[\s(«])[сС][ \u00A0]$/u.test(str.slice(Math.max(0, off - 3), off))) return m;
          return `${a}–`;
        },
      ),
  },
  {
    id: 'dash.sentence.ru',
    name: 'слово - слово → слово — слово (nbsp before, ru)',
    category: 'dashes',
    appliesTo: 'ru',
    priority: 610,
    apply: (t) => t.replace(/([ \u00A0])[-–]( )/g, `${NBSP}— `).replace(/ —/g, `${NBSP}—`),
  },
  {
    id: 'dash.sentence.en',
    name: 'word - word → word — word (en)',
    category: 'dashes',
    appliesTo: 'en',
    priority: 615,
    apply: (t) => t.replace(/ [-–] /g, ' — '),
  },
  {
    id: 'dash.enumColon',
    name: 'вариант «А»: 5000 → вариант «А» — 5000 (§26)',
    category: 'dashes',
    appliesTo: 'ru',
    priority: 620,
    // After a closing quote/bracket, a colon introducing a value is a dash.
    apply: (t) => t.replace(/([»)\]])[ \u00A0]*:[ \u00A0]*(?=\d)/g, '$1 — '),
  },
  {
    id: 'dash.dotRange',
    name: '10…15 → 10—15 (range written with dots)',
    category: 'dashes',
    appliesTo: 'all',
    priority: 625,
    apply: (t) => t.replace(/(\d)…(\d)/g, '$1—$2'),
  },
  {
    id: 'dash.range',
    name: '5-10 → 5–10 (en dash; dates/phones/«с 2020-2026» guarded)',
    category: 'dashes',
    appliesTo: 'all',
    priority: 630,
    // CONTEXT: a year-year range right after «с» is a «с … по …»
    // construction (§10.2) — the aggressive dates rule rewrites it; the
    // conservative mode leaves it untouched rather than en-dashing it.
    apply: (t) =>
      t.replace(/(?<![\d.,:–—-])(\d+)-(\d+)(?![\d.,:–—-])/g, (m, a: string, b: string, off: number, str: string) => {
        if (a.length === 4 && b.length === 4 && /(^|[\s(«])[сС][ \u00A0]$/.test(str.slice(Math.max(0, off - 3), off))) {
          return m;
        }
        return `${a}–${b}`;
      })
        // 50%-75% -> 50%–75% (a % suffix marks a range just as surely as digits)
        .replace(/(?<![\d.,:–—-])(\d+(?:[.,]\d+)?[ \u00A0]?)%-(?=\d)/g, '$1%–')
        // $10-$20 -> $10–$20 (currency prefix on the right operand)
        .replace(/(\d)-(?=[$€£¥₽₺₴₸]\d)/g, '$1–'),
  },
  {
    id: 'dash.minusBeforeDigit',
    name: '–5°C → -5°C (attached dash before a digit is a minus)',
    category: 'dashes',
    appliesTo: 'all',
    priority: 635,
    // Attached en/em dash right before a digit (no space) is a MINUS sign
    // typed with the wrong char. Ranges (5–10) have a digit before the dash
    // and are excluded; the sentence dash «товара — 1 999» has a space after
    // and is excluded too.
    // A dash right after % or a currency sign closes a range (50%–75%,
    // $10–$20) — that is never a minus.
    apply: (t) => t.replace(/(?<![\d\p{L}%$€£¥₽₺₴₸–—-])([–—])(?=\d)/gu, '-'),
  },
  {
    id: 'dash.nbHyphenRepeat.ru',
    name: 'еле-еле → non-breaking hyphen inside word repeats',
    category: 'dashes',
    appliesTo: 'ru',
    priority: 640,
    apply: (t) => t.replace(/(?<![\p{L}])([а-яё]{2,})-(\1)(?![\p{L}])/gu, '$1\u2011$2'),
  },
];

// ---------------------------------------------------------------------------
// Phones (650–699) — §14: obvious RU numbers only; numbers inside URLs are
// protected upstream.
// ---------------------------------------------------------------------------

const phoneRules: Rule[] = [
  {
    id: 'phone.ru',
    name: '+7(999)123-45-67 → +7 999 123-45-67',
    category: 'phones',
    appliesTo: 'all',
    priority: 650,
    apply: (t) =>
      t.replace(
        /(?<![\d\u202F-])(?:\+7|8)[ (]*(\d{3})[ )]*[ -]?(\d{3})[ -]?(\d{2})[ -]?(\d{2})(?![\d-])/g,
        (_, a, b, c, d) => `+7${NBSP}${a}${NBSP}${b}-${c}-${d}`,
      ),
  },
];

// ---------------------------------------------------------------------------
// Numbers (700–749) — §13: decimal comma only for REAL decimals; versions,
// IPs and identifiers guarded.
// ---------------------------------------------------------------------------

const numberRules: Rule[] = [
  {
    id: 'number.fractions',
    name: '1/2 → ½ (standalone simple fractions)',
    category: 'numbers',
    appliesTo: 'all',
    priority: 700,
    apply: (t) => {
      const map: Record<string, string> = {
        '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
        '1/6': '⅙', '5/6': '⅚', '1/7': '⅐', '1/9': '⅑', '1/10': '⅒',
        '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
      };
      return t.replace(/(?<![\d/.,])(\d{1,2}\/\d{1,2})(?![\d/.,])/g, (m) => map[m] ?? m);
    },
  },
  {
    id: 'number.ungroupYear',
    name: '2 026 год / 1 920 px → 2026 год / 1920 px (wrong 4-digit grouping)',
    category: 'numbers',
    appliesTo: 'ru',
    priority: 703,
    apply: (t) =>
      t.replace(/(?<![\d\u202F])(\d)[ \u00A0\u202F](\d{3})(?=[ \u00A0]?(?:px|пикс|г\.|гг\.|год))/g, '$1$2'),
  },
  {
    id: 'number.decimalComma.ru',
    name: '12.5 → 12,5 (ru; versions & partial dates «с 25.08 по…» intact)',
    category: 'numbers',
    appliesTo: 'ru',
    priority: 705,
    // CONTEXT: D.MM inside a date construction («с 25.08 по …») is a date,
    // not a decimal — left untouched (§10.1).
    apply: (t) =>
      t.replace(
        /(?<![\d.,])(\d+)\.(\d+)(?![\d.])/g,
        (m, a: string, b: string, off: number, str: string) => {
          const dayLike = /^(0?[1-9]|[12]\d|3[01])$/.test(a);
          const monthLike = /^(0[1-9]|1[0-2])$/.test(b);
          if (dayLike && monthLike) {
            const before = str.slice(Math.max(0, off - 4), off);
            const after = str.slice(off + m.length, off + m.length + 5);
            if (
              /(^|[\s(«])(с|по|до|от)[ \u00A0]$/i.test(before) ||
              /^[ \u00A0](по|до)([ \u00A0]|$)/i.test(after)
            ) {
              return m;
            }
          }
          return `${a},${b}`;
        },
      ),
  },
  {
    id: 'number.grouping',
    name: '1000 → 1 000 (context-aware: years, ×-sizes, №, phones intact, §5)',
    category: 'numbers',
    appliesTo: 'ru',
    priority: 710,
    // CONTEXT guards (§5.1): bare 4-digit years (1900–2099) stay — unless a
    // currency follows (1999 ₽ → 1 999 ₽); numbers next to ×/x are technical
    // sizes (1920 × 1080); numbers after № are document ids; «2026 год/г.»
    // stays. Phones are formatted earlier and never reach this rule.
    apply: (t) =>
      t.replace(/(?<![\d,.\u202F–—-])\d{4,}(?![\d,.\u202F–—-])/g, (m, off: number, str: string) => {
        const before = str.slice(Math.max(0, off - 6), off);
        const after = str.slice(off + m.length, off + m.length + 12);
        if (/^[ \u00A0]*[x×х]/i.test(after) || /[x×х][ \u00A0]*$/i.test(before)) return m;
        if (/№[ \u00A0\u202F]*$/.test(before)) return m;
        if (/^[ \u00A0]*(г\.|гг\.|год)/.test(after)) return m;
        const currency = /^[ \u00A0\u202F]?(₽|руб|рубл|\$|€|£|долл)/.test(after);
        if (m.length === 4 && +m >= 1900 && +m <= 2099 && !currency) return m;
        return m.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
      }),
  },
  {
    id: 'number.grouping.en',
    name: '10000 → 10,000 (en comma grouping, 5+ digits)',
    category: 'numbers',
    appliesTo: 'en',
    priority: 712,
    // English style: thousands separated by commas from 5 digits up
    // (4-digit numbers — 1000, 1920 px, 2025 — stay solid). Same context
    // guards as the ru rule.
    apply: (t) =>
      t.replace(/(?<![\d,.\u202F–—-])\d{5,}(?![\d,.\u202F–—-])/g, (m, off: number, str: string) => {
        const before = str.slice(Math.max(0, off - 6), off);
        const after = str.slice(off + m.length, off + m.length + 12);
        if (/^[ \u00A0]*[x×]/i.test(after) || /[x×][ \u00A0]*$/i.test(before)) return m;
        if (/№[ \u00A0\u202F]*$/.test(before)) return m;
        return m.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }),
  },
];

// ---------------------------------------------------------------------------
// Currency (750–799) — §10, §27: normalize the notation, keep the style.
// Default keeps «руб.» (word style); ₽ substitution is aggressive-only so
// one document never mixes styles unintentionally.
// ---------------------------------------------------------------------------

const currencyRules: Rule[] = [
  {
    id: 'currency.rubNormalize',
    name: '5000руб / 2500р. → 5000 руб. (§27)',
    category: 'currency',
    appliesTo: 'ru',
    priority: 750,
    apply: (t) => t.replace(/(\d)[ \u00A0]*(?:руб\.|руб|р\.)(?![\p{L}])/gu, `$1${NBSP}руб.`),
  },
  {
    id: 'currency.rubSign',
    name: '5000 руб. → 5000 ₽ (aggressive style switch)',
    category: 'currency',
    appliesTo: 'ru',
    priority: 755,
    aggressive: true,
    // CONTEXT: «2499 руб.» at the end of a sentence — the dot doubles as the
    // sentence period, so it is kept: «2 499 ₽.» (§29). Mid-sentence the dot
    // belongs to the abbreviation only and is dropped: «1 999 ₽ вместо…».
    apply: (t) =>
      t
        .replace(/(\d)[ \u00A0]*руб\.(?=[ \u00A0]*(?:\n|$)|[ \u00A0]+[«А-ЯЁA-Z])/g, `$1${NBSP}₽.`)
        .replace(/(\d)[ \u00A0]*руб\.(?![\p{L}])/gu, `$1${NBSP}₽`),
  },
  {
    id: 'currency.prefix.ru',
    name: '$100 → 100 $ (ru: sign after the amount, §10)',
    category: 'currency',
    appliesTo: 'ru',
    priority: 760,
    apply: (t) =>
      // The number may contain grouping/decimal separators, but only BETWEEN
      // digits — a trailing sentence comma/dot is not part of the amount.
      t.replace(/([$€£¥₽₺₴₸])[ \u00A0]?(\d(?:[\d\u202F]|[.,]\d)*)/g, (_, sign, num) => `${num}${NBSP}${sign}`),
  },
  {
    id: 'currency.nbsp',
    name: '899$ / 899 $ → 899 $ (nbsp before the sign)',
    category: 'currency',
    appliesTo: 'all',
    priority: 765,
    apply: (t) => t.replace(/(\d)[ \u00A0]*([₽$€£¥₩₹₺₴₸₪₿])/g, `$1${NBSP}$2`),
  },
];

// ---------------------------------------------------------------------------
// Units (800–849) — §11, §12: glue number+unit with nbsp, insert the
// missing space, мАч → мА·ч (middle dot).
// ---------------------------------------------------------------------------

const unitRules: Rule[] = [
  {
    id: 'unit.mah',
    name: 'мАч / mAh → мА·ч (ru, §12)',
    category: 'units',
    appliesTo: 'ru',
    priority: 800,
    apply: (t) => t.replace(/(\d)[ \u00A0]*(?:мАч|мА·ч|mAh)(?![\p{L}·])/gu, `$1${NBSP}мА·ч`),
  },
  {
    id: 'unit.space.ru',
    name: '180г → 180 г (nbsp; common units, §11)',
    category: 'units',
    appliesTo: 'ru',
    priority: 805,
    // Longer alternatives first. A letter/·/. right after the unit means a
    // different word (год, мАч handled above) — skipped.
    apply: (t) =>
      t.replace(
        /(\d)[ \u00A0]*(мм|см|км|кг|мг|мл|мин|сек|кВт|МВт|Вт|мА|ГГц|МГц|кГц|Гц|ТБ|ГБ|МБ|КБ|шт|мес|м|г|л|с|ч|В|А)(?![\p{L}·.²³])/gu,
        `$1${NBSP}$2`,
      ),
  },
  {
    id: 'unit.space.en',
    name: '5kg → 5 kg (nbsp; en units)',
    category: 'units',
    appliesTo: 'en',
    priority: 810,
    apply: (t) =>
      t.replace(/(\d)[ \u00A0]*(kg|km|mm|cm|ml|mph|dpi|px|GB|MB|KB|TB|GHz|MHz|Hz|W|kW|m|g|l|s|h)(?![A-Za-z])/g, `$1${NBSP}$2`),
  },
];

// ---------------------------------------------------------------------------
// Numero (850–899) — §18: N342 → № 342 (ru text only — latin N in math or
// code contexts stays; code is protected upstream anyway).
// ---------------------------------------------------------------------------

const numeroRules: Rule[] = [
  {
    id: 'numero.latinN',
    name: 'N342 / № 342 normalization (§18)',
    category: 'numero',
    appliesTo: 'ru',
    priority: 850,
    apply: (t) => t.replace(/(?<![\p{L}\p{N}])[N№][ \u00A0]*(?=\d)/gu, `№${NBSP}`),
  },
];

// ---------------------------------------------------------------------------
// Abbreviations (900–949) — §15, §19, §20, §28
// ---------------------------------------------------------------------------

const abbrevRules: Rule[] = [
  {
    id: 'abbrev.pageRefs',
    name: 'п.3 → п. 3 (nbsp; п/ст/ч/гл/рис/табл/стр, §19)',
    category: 'abbrev',
    appliesTo: 'ru',
    priority: 900,
    apply: (t) =>
      t.replace(/(^|[\s(«])(пп|п|ст|гл|рис|табл|стр|прим)\.[ \u00A0]*(?=\d)/gm, `$1$2.${NBSP}`),
  },
  {
    id: 'abbrev.addrRefs',
    name: 'кв.2 → кв. 2 (nbsp; адресные сокращения)',
    category: 'abbrev',
    appliesTo: 'ru',
    priority: 901,
    // Missing space after the dot in address abbreviations (§: опечатки
    // сокращений). «д.» included — a digit right after means an address.
    apply: (t) =>
      t.replace(/(^|[\s(«,])(кв|д|корп|оф|каб|эт|пом|уч|влд)\.[ \u00A0]*(?=\d)/gm, `$1$2.${NBSP}`),
  },
  {
    id: 'abbrev.seeAlso.ru',
    name: 'см. / ср. / напр. glue to the next word',
    category: 'abbrev',
    appliesTo: 'ru',
    priority: 902,
    apply: (t) => t.replace(/(^|[\s(«])(см|ср|напр)\.[ \u00A0]+(?=[\p{L}\d«])/gmu, `$1$2.${NBSP}`),
  },
  {
    id: 'abbrev.perSlash',
    name: 'руб/мес → руб./мес. (keep dots in norm. abbreviations, §28)',
    category: 'abbrev',
    appliesTo: 'ru',
    priority: 905,
    apply: (t) => t.replace(/\/(мес|год|шт|чел|сут|кв)(?![\p{L}.])/gu, '/$1.'),
  },
  {
    id: 'abbrev.telExpand',
    name: 'тел. +7… → телефону +7… (aggressive, §15)',
    category: 'abbrev',
    appliesTo: 'ru',
    priority: 910,
    aggressive: true,
    apply: (t) => t.replace(/(^|[\s(])тел\.[ \u00A0]*(?=[+\d8])/gm, '$1телефону '),
  },
  {
    id: 'abbrev.names',
    name: 'конституция РФ → Конституция РФ (narrow whitelist, §20)',
    category: 'abbrev',
    appliesTo: 'ru',
    priority: 915,
    apply: (t) => t.replace(/конституци(я|и|ю|ей|е)(?=[ \u00A0]РФ)/g, 'Конституци$1'),
  },
];

// ---------------------------------------------------------------------------
// Non-breaking spaces (950–999) — §30. Real U+00A0, applied late so they
// operate on final spacing.
// ---------------------------------------------------------------------------

const nbspRules: Rule[] = [
  {
    id: 'nbsp.initials.ru',
    name: 'А.С. Пушкин → А. С. Пушкин (nbsp)',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 950,
    apply: (t) =>
      t.replace(
        /([А-ЯЁ])\.[ \u00A0]*([А-ЯЁ])\.[ \u00A0]*(?=[А-ЯЁ][а-яё])/g,
        `$1.${NBSP}$2.${NBSP}`,
      ),
  },
  {
    id: 'nbsp.abbrevTd.ru',
    name: 'и т. д. / т. п. glue',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 955,
    apply: (t) =>
      t
        .replace(/(^|[\s(«])т\.[ \u00A0]*д\./g, `$1т.${NBSP}д.`)
        .replace(/(^|[\s(«])т\.[ \u00A0]*п\./g, `$1т.${NBSP}п.`)
        .replace(/(^|[\s(«])и[ \u00A0]+(т\.)/g, `$1и${NBSP}$2`),
  },
  {
    id: 'nbsp.geo.ru',
    name: 'г. Москва, ул. Ленина, д. 5 glue',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 960,
    apply: (t) =>
      t.replace(/(^|[\s(«])(г|ул|д|кв|пр|пос|пер|обл|р-н)\.[ \u00A0]+(?=[А-ЯЁ0-9])/g, `$1$2.${NBSP}`),
  },
  {
    id: 'nbsp.numero',
    name: '№ 342 glue',
    category: 'nbsp',
    appliesTo: 'all',
    priority: 965,
    apply: (t) => t.replace(/№[ \u00A0]*(\d)/g, `№${NBSP}$1`),
  },
  {
    id: 'nbsp.numberUnit.ru',
    name: '2012 г. / 5 млн / 25 кг / 1 мес. glue',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 970,
    apply: (t) =>
      t.replace(
        /(\d)[ \u00A0]+(гг?\.|г\b|млн|млрд|трлн|тыс\.?|мес\.?|кг|км|мм|см|руб|коп|шт|чел|лет|год[ауе]?|стр\.|гл\.|рис\.)(?!\p{L})/gu,
        `$1${NBSP}$2`,
      ),
  },
  {
    id: 'nbsp.month.ru',
    name: '12 мая glue (§30)',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 972,
    apply: (t) =>
      t.replace(
        new RegExp(`(\\d)[ ]+(${MONTHS_RU})(?![\\p{L}])`, 'gu'),
        `$1${NBSP}$2`,
      ),
  },
  {
    id: 'nbsp.ordinal.ru',
    name: '5-й класс → 5-й(nbsp)класс (ordinal numbers)',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 973,
    apply: (t) => t.replace(/(\d+-(?:й|я|е|х|го|му|ю)) (?=[\p{L}])/gu, `$1${NBSP}`),
  },
  {
    id: 'nbsp.numberWord.ru',
    name: '8 блоков → 8(nbsp)блоков (number glued to the next word)',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 974,
    apply: (t) => t.replace(/(\d) (?=[а-яё])/g, `$1${NBSP}`),
  },
  {
    id: 'nbsp.timeOfDay.ru',
    name: '10:30 утра → 10:30(nbsp)утра',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 976,
    apply: (t) => t.replace(/(\d{1,2}:\d{2}) (?=(?:утра|вечера|дня|ночи)(?![\p{L}]))/gu, `$1${NBSP}`),
  },
  {
    id: 'nbsp.surnameInitials.ru',
    name: 'Петров А.С. → Петров(nbsp)А. С. (surname-first initials)',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 977,
    apply: (t) =>
      t
        .replace(/(?<=[А-ЯЁ][а-яё]{2,}) (?=[А-ЯЁ]\.[ \u00A0]?[А-ЯЁ]\.)/g, NBSP)
        .replace(/(?<=[А-ЯЁ][а-яё]{2,}[\u00A0])([А-ЯЁ])\.[ \u00A0]*([А-ЯЁ])\.(?![\p{L}])/gu, `$1.${NBSP}$2.`),
  },
  {
    id: 'nbsp.numberUnit.en',
    name: '5 kg glue (en)',
    category: 'nbsp',
    appliesTo: 'en',
    priority: 975,
    apply: (t) => t.replace(/(\d)[ ]+(kg|km|mm|cm|m|lb|oz|ft|in|mph|dpi|lpi|px)(?![a-z])/g, `$1${NBSP}$2`),
  },
  {
    id: 'nbsp.initials.en',
    name: 'J. R. R. Tolkien — initials glued (en)',
    category: 'nbsp',
    appliesTo: 'en',
    priority: 951,
    // Chained one initial at a time so J. R. R. Tolkien glues fully.
    apply: (t) => t.replace(/([A-Z])\.[ \u00A0]*(?=[A-Z]\.|[A-Z][a-z])/g, `$1.${NBSP}`),
  },
  {
    id: 'nbsp.honorifics.en',
    name: 'Mr. Smith / Dr. House — title glued to the name',
    category: 'nbsp',
    appliesTo: 'en',
    priority: 978,
    apply: (t) => t.replace(/\b(Mr|Mrs|Ms|Dr|Prof|St|Capt|Sgt|Lt|Col)\.[ \u00A0]+(?=[A-Z])/g, `$1.${NBSP}`),
  },
  {
    id: 'nbsp.ampm.en',
    name: '10:30 AM — time glued to its AM/PM mark',
    category: 'nbsp',
    appliesTo: 'en',
    priority: 979,
    apply: (t) => t.replace(/(\d{1,2}(?::\d{2})?)[ \u00A0]+([AP]M)(?![\p{L}])/gu, `$1${NBSP}$2`),
  },
  {
    id: 'nbsp.ordinal.en',
    name: '5th floor / 3rd frame — ordinal glued to the next word',
    category: 'nbsp',
    appliesTo: 'en',
    priority: 981,
    apply: (t) => t.replace(/(\d+(?:st|nd|rd|th)) (?=[A-Za-z])/g, `$1${NBSP}`),
  },
  {
    id: 'nbsp.particles.ru',
    name: 'ли/же/бы glue to the previous word',
    category: 'nbsp',
    appliesTo: 'ru',
    priority: 980,
    apply: (t) => t.replace(/(\p{L}) (ли|ль|же|ж|бы|б)(?![\p{L}])/gu, `$1${NBSP}$2`),
  },
  {
    id: 'nbsp.beforeDash',
    name: 'nbsp before em dash',
    category: 'nbsp',
    appliesTo: 'all',
    priority: 985,
    apply: (t) => t.replace(/ —/g, `${NBSP}—`),
  },
];

// ---------------------------------------------------------------------------
// Hanging short words (1000–1049) — §31: its own toggle. A 1–2-letter word
// glues forward so prepositions never dangle at line ends.
// ---------------------------------------------------------------------------

const hangingRules: Rule[] = [
  {
    id: 'hanging.shortWords',
    name: 'в / и / на / не … glue forward (§31)',
    category: 'hanging',
    appliesTo: 'all',
    priority: 1000,
    // Lookbehind (not a consuming group) so ADJACENT short words chain in
    // one pass («и не вернулся» → «и\u00A0не\u00A0вернулся») — idempotent.
    apply: (t) => t.replace(/(?<=^|[\s(«“])(\p{L}{1,2}) (?=[\p{L}\p{N}«“(])/gmu, `$1${NBSP}`),
  },
  {
    id: 'hanging.serviceWords.en',
    name: 'the / and / from / with … glue forward (en service words)',
    category: 'hanging',
    appliesTo: 'en',
    priority: 1005,
    // 1–2-letter words are covered by hanging.shortWords; this adds the
    // competitor's 3–4-letter articles, prepositions, conjunctions,
    // auxiliaries and pronouns. Lookbehind (not a consuming group) so
    // adjacent matches chain in one pass.
    apply: (t) =>
      t.replace(
        /(?<=^|[\s(“])(the|and|for|are|was|has|had|can|may|did|let|you|our|who|any|all|one|two|not|yes|but|nor|yet|from|into|onto|upon|with|over|down|near|past|this|that|have|been|will|must|does|they|them|your|mine|ours|whom|some|each|both) (?=[\w“(])/gim,
        `$1${NBSP}`,
      ),
  },
];

// ---------------------------------------------------------------------------
// Ё (1050+) — §7: dictionary of unambiguous forms only; own toggle,
// default OFF (letters are rewritten).
// ---------------------------------------------------------------------------

const yoRules: Rule[] = [
  {
    id: 'yo.dictionary',
    name: 'еще → ещё, ждем → ждём, расчет → расчёт … (safe forms, §7)',
    category: 'yo',
    appliesTo: 'ru',
    priority: 1050,
    apply: (t) =>
      t
        .replace(/(^|[^\p{L}])еще(?![\p{L}])/gmu, '$1ещё')
        .replace(/(^|[^\p{L}])Еще(?![\p{L}])/gmu, '$1Ещё')
        .replace(
          /жд(ем|ете|ет)(?![\p{L}])/gu,
          (_, end: string) => `жд${({ ем: 'ём', ет: 'ёт', ете: 'ёте' } as Record<string, string>)[end]}`,
        )
        .replace(/расчет/g, 'расчёт')
        .replace(/Расчет/g, 'Расчёт')
        .replace(/зелен(?=(?:ый|ая|ое|ые|ым|ой|ого|ому|ыми|ых)(?![\p{L}]))/gu, 'зелён')
        .replace(/Зелен(?=(?:ый|ая|ое|ые|ым|ой|ого|ому|ыми|ых)(?![\p{L}]))/gu, 'Зелён')
        .replace(/(^|[^\p{L}])(е)лк([аиуе])(?![\p{L}])/gmu, (_, p, e, end) =>
          `${p}${e === 'е' ? 'ё' : 'Ё'}лк${end}`,
        ),
  },
];

// ---------------------------------------------------------------------------
// The deterministic pipeline (§37): RULES is sorted by priority. Key order
// constraints (documented contract):
//   - time & ISO dates BEFORE dashes (9-00 / 2026-08-25 must not become
//     ranges);
//   - phones BEFORE numbers (grouping must not split 89061234567);
//   - currency/units/numero/abbrev after numbers;
//   - nbsp late (operates on final spacing); hanging after nbsp; yo last.
// ---------------------------------------------------------------------------

export const RULES: Rule[] = [
  ...spaceRules,
  ...punctuationRules,
  ...quoteRules,
  ...specialRules,
  ...mathRules,
  ...dateRules,
  ...timeRules,
  ...dashRules,
  ...phoneRules,
  ...numberRules,
  ...currencyRules,
  ...unitRules,
  ...numeroRules,
  ...abbrevRules,
  ...nbspRules,
  ...hangingRules,
  ...yoRules,
].sort((a, b) => a.priority - b.priority);

export const RULE_CATEGORIES: RuleCategory[] = [
  'quotes',
  'dashes',
  'spaces',
  'punctuation',
  'nbsp',
  'hanging',
  'specials',
  'math',
  'numbers',
  'dates',
  'time',
  'currency',
  'units',
  'phones',
  'numero',
  'abbrev',
  'yo',
];
