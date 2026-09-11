import { beforeEach, describe, expect, it } from 'vitest';
import {
  typograf,
  typografDetailed,
  DEFAULT_CATEGORIES,
  RULES,
  RULE_CATEGORIES,
} from '../src/processors/typograf/engine';
import { detectLanguage } from '../src/processors/typograf/detect';
import { protect, restore } from '../src/processors/typograf/protect';
import { SYMBOLS, SYMBOL_CATEGORIES, searchSymbols } from '../src/processors/typograf/symbols';
import { diffChanges } from '../src/processors/typograf/diff';
import {
  loadSymbolFavorites,
  loadTypografSettings,
  saveTypografSettings,
  toggleSymbolFavorite,
} from '../src/storage/typograf';

const NBSP = '\u00A0';
const NNBSP = '\u202F';

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

describe('typograf: language detection', () => {
  it('detects Russian and English', () => {
    expect(detectLanguage('Привет, мир')).toBe('ru');
    expect(detectLanguage('Hello world')).toBe('en');
    expect(detectLanguage('Привет hello друг')).toBe('ru');
  });
});

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

describe('typograf: quotes', () => {
  it('converts "Привет" to «Привет»', () => {
    expect(typograf('"Привет"')).toBe('«Привет»');
    expect(typograf('Он сказал "привет" мне')).toBe(`Он${NBSP}сказал «привет» мне`);
  });

  it('converts English quotes to curly', () => {
    expect(typograf('He said "hello" now', { language: 'en', categories: onlyCats('quotes') })).toBe(
      'He said “hello” now',
    );
  });

  it('handles one nesting level in Russian («а „б“ в»)', () => {
    expect(typograf('"а "б" в"', { categories: onlyCats('quotes') })).toBe('«а „б“ в»');
  });

  it('handles nested English quotes', () => {
    expect(typograf('"a "b" c"', { language: 'en', categories: onlyCats('quotes') })).toBe(
      '“a ‘b’ c”',
    );
  });
});

// ---------------------------------------------------------------------------
// Dashes
// ---------------------------------------------------------------------------

describe('typograf: dashes', () => {
  it('converts A--B to A—B', () => {
    expect(typograf('A--B', { language: 'en', categories: onlyCats('dashes') })).toBe('A—B');
  });

  it('converts spaced hyphen to em dash (ru: nbsp before)', () => {
    expect(typograf('это - тест', { categories: onlyCats('dashes') })).toBe(`это${NBSP}— тест`);
  });

  it('converts spaced hyphen to em dash (en)', () => {
    expect(typograf('this - test', { language: 'en', categories: onlyCats('dashes') })).toBe(
      'this — test',
    );
  });

  it('converts digit ranges to en dash', () => {
    expect(typograf('5-10', { categories: onlyCats('dashes') })).toBe('5–10');
  });

  it('formats direct speech at line start (ru)', () => {
    expect(typograf('- Привет', { categories: onlyCats('dashes') })).toBe('— Привет');
  });

  it('does not break ISO dates in English text', () => {
    expect(typograf('due 2026-08-25 ok', { language: 'en', categories: onlyCats('dashes') })).toBe(
      'due 2026-08-25 ok',
    );
  });
});

// ---------------------------------------------------------------------------
// Special symbols
// ---------------------------------------------------------------------------

describe('typograf: special symbols', () => {
  it('converts (c), (r), (tm)', () => {
    expect(typograf('(c) 2026 (r) (tm)', { language: 'en', categories: onlyCats('specials') })).toBe(
      '© 2026 ® ™',
    );
  });

  it('converts 10 x 5 to 10 × 5 with non-breaking spaces', () => {
    expect(typograf('10 x 5', { categories: onlyCats('math') })).toBe(`10${NBSP}×${NBSP}5`);
    expect(typograf('10 х 5', { categories: onlyCats('math') })).toBe(`10${NBSP}×${NBSP}5`);
  });

  it('converts math signs <=, >=, !=, ~=, +-', () => {
    expect(typograf('a <= b >= c != d +- e', { language: 'en', categories: onlyCats('math') })).toBe(
      'a ≤ b ≥ c ≠ d ± e',
    );
    expect(typograf('a ~= b', { language: 'en', categories: onlyCats('math') })).toBe('a ≈ b');
  });

  it('converts arrows', () => {
    expect(typograf('a -> b <- c => d', { language: 'en', categories: onlyCats('specials') })).toBe(
      'a → b ← c ⇒ d',
    );
  });

  it('converts м2 / m3 to superscripts', () => {
    expect(typograf('25 м2 и 10 м3', { categories: onlyCats('specials') })).toBe('25 м² и 10 м³');
  });
});

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

describe('typograf: numbers', () => {
  it('converts 1/2 to ½', () => {
    expect(typograf('add 1/2 cup', { language: 'en', categories: onlyCats('numbers') })).toBe(
      'add ½ cup',
    );
  });

  it('does not touch fractions inside longer numbers', () => {
    expect(typograf('21/22', { language: 'en', categories: onlyCats('numbers') })).toBe('21/22');
  });

  it('uses decimal comma in Russian (12.5 → 12,5) but keeps versions', () => {
    expect(typograf('вес 12.5 кг', { categories: onlyCats('numbers') })).toBe('вес 12,5 кг');
    expect(typograf('версия 1.2.3 вышла', { categories: onlyCats('numbers') })).toBe(
      'версия 1.2.3 вышла',
    );
  });

  it('groups long integers with narrow nbsp; years stay intact', () => {
    expect(typograf('1000000', { categories: onlyCats('numbers') })).toBe(
      `1${NNBSP}000${NNBSP}000`,
    );
    expect(typograf('в 2026 году', { categories: onlyCats('numbers') })).toBe('в 2026 году');
  });
});

// ---------------------------------------------------------------------------
// Dates (ru)
// ---------------------------------------------------------------------------

describe('typograf: dates', () => {
  it('converts ISO dates to DD.MM.YYYY in Russian text', () => {
    expect(typograf('срок 2026-08-25 истёк', { categories: onlyCats('dates') })).toBe(
      'срок 25.08.2026 истёк',
    );
  });

  it('lowercases month after a number: 2 Мая → 2 мая', () => {
    expect(typograf('приду 2 Мая утром', { categories: onlyCats('dates') })).toBe(
      'приду 2 мая утром',
    );
  });

  it('lowercases weekday after a comma: , Понедельник → , понедельник', () => {
    expect(typograf('завтра, Понедельник, приду', { categories: onlyCats('dates') })).toBe(
      'завтра, понедельник, приду',
    );
  });
});

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

describe('typograf: currency', () => {
  it('normalizes rubles keeping the word style by default (§27)', () => {
    expect(typograf('цена 100 руб.', { categories: onlyCats('currency') })).toBe(
      `цена 100${NBSP}руб.`,
    );
    expect(typograf('цена 2500р.', { categories: onlyCats('currency') })).toBe(
      `цена 2500${NBSP}руб.`,
    );
    expect(typograf('цена 5000руб', { categories: onlyCats('currency') })).toBe(
      `цена 5000${NBSP}руб.`,
    );
  });

  it('switches to the ₽ sign only in aggressive mode', () => {
    expect(
      typograf('цена 100 руб.', { categories: onlyCats('currency'), aggressive: true }),
    ).toBe(`цена 100${NBSP}₽.`);
    expect(
      typograf('за 100 руб. сразу', { categories: onlyCats('currency'), aggressive: true }),
    ).toBe(`за 100${NBSP}₽ сразу`);
  });

  it('moves $ after the amount in Russian text', () => {
    expect(typograf('это стоит $100 сейчас', { categories: onlyCats('currency') })).toBe(
      `это стоит 100${NBSP}$ сейчас`,
    );
  });
});

// ---------------------------------------------------------------------------
// Phones
// ---------------------------------------------------------------------------

describe('typograf: phones', () => {
  it('formats Russian phone numbers', () => {
    expect(typograf('звони +7 906 123 45 67', { categories: onlyCats('phones') })).toBe(
      `звони +7${NBSP}906${NBSP}123-45-67`,
    );
    expect(typograf('тел 89061234567', { categories: onlyCats('phones') })).toBe(
      `тел +7${NBSP}906${NBSP}123-45-67`,
    );
  });
});

// ---------------------------------------------------------------------------
// Non-breaking spaces
// ---------------------------------------------------------------------------

describe('typograf: nbsp', () => {
  it('formats initials: А.С. Пушкин → А. С. Пушкин with nbsp', () => {
    expect(typograf('А.С. Пушкин', { categories: onlyCats('nbsp') })).toBe(
      `А.${NBSP}С.${NBSP}Пушкин`,
    );
  });

  it('glues numbers to units: 2012 г.', () => {
    expect(typograf('в 2012 г. было', { categories: onlyCats('nbsp') })).toBe(
      `в 2012${NBSP}г. было`,
    );
  });

  it('glues geo abbreviations: г. Москва', () => {
    expect(typograf('г. Москва', { categories: onlyCats('nbsp') })).toBe(`г.${NBSP}Москва`);
  });

  it('glues № to its number', () => {
    expect(typograf('приказ № 5', { categories: onlyCats('nbsp') })).toBe(
      `приказ №${NBSP}5`,
    );
  });

  it('glues short words to the next word (hanging category, §31)', () => {
    expect(typograf('я иду в лес', { categories: onlyCats('hanging') })).toBe(
      `я${NBSP}иду в${NBSP}лес`,
    );
  });

  it('glues particles to the previous word', () => {
    expect(typograf('видишь ли ты', { categories: onlyCats('nbsp') })).toBe(
      `видишь${NBSP}ли ты`,
    );
  });
});

// ---------------------------------------------------------------------------
// Spaces & punctuation
// ---------------------------------------------------------------------------

describe('typograf: spaces & punctuation', () => {
  it('fixes spaces around punctuation', () => {
    expect(
      typograf('Привет ,  мир !', { categories: onlyCats('spaces', 'punctuation') }),
    ).toBe('Привет, мир!');
  });

  it('adds a missing space after a comma', () => {
    expect(typograf('раз,два', { categories: onlyCats('spaces') })).toBe('раз, два');
  });

  it('converts ... to …', () => {
    expect(typograf('Привет...', { categories: onlyCats('punctuation') })).toBe('Привет…');
  });

  it('collapses doubled ! and ?', () => {
    expect(typograf('Что?? Нет!!', { categories: onlyCats('punctuation') })).toBe('Что? Нет!');
  });

  it('converts apostrophe to typographic', () => {
    expect(typograf("it's fine", { language: 'en', categories: onlyCats('punctuation') })).toBe(
      'it’s fine',
    );
  });
});

// ---------------------------------------------------------------------------
// Keyboard layout fix (reuses Layout Switcher)
// ---------------------------------------------------------------------------

describe('typograf: layout fix', () => {
  it('fixes Ghbdtn → Привет when enabled', () => {
    expect(typograf('Ghbdtn', { fixLayout: true })).toBe('Привет');
  });

  it('is off by default', () => {
    expect(typograf('Ghbdtn', { language: 'en' })).toBe('Ghbdtn');
  });
});

// ---------------------------------------------------------------------------
// Ё (opt-in)
// ---------------------------------------------------------------------------

describe('typograf: yo', () => {
  it('is opt-in and converts safe forms only', () => {
    expect(typograf('еще раз', { categories: onlyCats() })).toBe('еще раз');
    expect(typograf('еще раз', { categories: onlyCats('yo') })).toBe('ещё раз');
    expect(typograf('Еще зеленый', { categories: onlyCats('yo') })).toBe('Ещё зелёный');
  });
});

// ---------------------------------------------------------------------------
// Protection: URLs, emails, HTML, code
// ---------------------------------------------------------------------------

describe('typograf: protection', () => {
  it('never modifies URLs', () => {
    const out = typograf('Смотри https://example.com/path?a=1&b=2 и пиши');
    expect(out).toContain('https://example.com/path?a=1&b=2');
  });

  it('never modifies emails', () => {
    const out = typograf('Пиши на test.user+tag@example.com сегодня');
    expect(out).toContain('test.user+tag@example.com');
  });

  it('never modifies HTML tags but formats text between them', () => {
    const out = typograf('<a href="https://x.com" class="btn">Он сказал "да"</a>');
    expect(out).toContain('<a href="https://x.com" class="btn">');
    expect(out).toContain('«да»');
    expect(out).toContain('</a>');
  });

  it('never modifies inline and fenced code', () => {
    expect(typograf('см. `a -> b` тут')).toContain('`a -> b`');
    const fenced = '```\nx != y\n```';
    expect(typograf(fenced)).toContain(fenced);
  });

  it('keeps Markdown link URLs intact', () => {
    const out = typograf('Вот [ссылка "тут"](https://example.com/a_(b)?q=1) для теста');
    expect(out).toContain('(https://example.com/a_(b)?q=1');
    expect(out).toContain('«тут»');
  });

  it('keeps HTML entities intact', () => {
    expect(typograf('a &nbsp; b &lt;tag&gt;', { language: 'en' })).toContain('&nbsp;');
  });

  it('protect/restore round-trips verbatim', () => {
    const src = 'text <b class="x">bold</b> `code` https://a.b/c?d=1 mail@example.com end';
    expect(restore(protect(src))).toBe(src);
  });
});

// ---------------------------------------------------------------------------
// Idempotency — the core contract: running twice equals running once
// ---------------------------------------------------------------------------

describe('typograf: idempotency', () => {
  const samples = [
    '"Привет" - сказал он... И т.д. Цена 100 руб. за 25 кг',
    'Он сказал "привет" мне 2 Мая, Понедельник, в 2012 г.',
    'А.С. Пушкин жил в г. Москва, ул. Арбат, д. 5',
    'звони +7 906 123 45 67 или 89061234567',
    'габариты 10 x 5, площадь 25 м2, темп 25 C',
    '(c) 2026, версия 1.2.3, вес 12.5 кг, всего 1000000 шт',
    'диапазон 5-10, дробь 1/2, a <= b, x -> y',
    'см. https://example.com/a?b=1 и пиши на mail@example.com',
    '<p>Он сказал "да" и ушел</p> `код -> тут`',
    'приказ № 5 от 2026-08-25, скидка 50 %',
    'He said "hello" -- it\'s 1/2 of 10 x 5 <= 100',
    '- Привет!!\n- Пока??\nМного    пробелов ,  и точек....',
  ];

  for (const [i, sample] of samples.entries()) {
    it(`sample #${i + 1} is stable on re-run`, () => {
      const once = typograf(sample);
      expect(typograf(once)).toBe(once);
    });
  }

  it('is stable with all categories on (including yo) too', () => {
    const cats = Object.fromEntries(Object.keys(DEFAULT_CATEGORIES).map((k) => [k, true]));
    for (const sample of samples) {
      const once = typograf(sample, { categories: cats });
      expect(typograf(once, { categories: cats })).toBe(once);
    }
  });
});

// ---------------------------------------------------------------------------
// Category toggles
// ---------------------------------------------------------------------------

describe('typograf: category toggles', () => {
  it('disabled category leaves its patterns untouched', () => {
    expect(typograf('"Привет"', { categories: onlyCats('spaces') })).toBe('"Привет"');
    expect(typograf('A--B', { language: 'en', categories: onlyCats('quotes') })).toBe('A--B');
  });

  it('empty input returns empty output', () => {
    expect(typograf('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Symbols dataset & search
// ---------------------------------------------------------------------------

describe('typograf symbols', () => {
  it('has unique characters and valid categories', () => {
    const chars = SYMBOLS.map((s) => s.char);
    expect(new Set(chars).size).toBe(chars.length);
    for (const s of SYMBOLS) {
      expect(SYMBOL_CATEGORIES).toContain(s.category);
      expect(s.nameRu.length).toBeGreaterThan(0);
      expect(s.nameEn.length).toBeGreaterThan(0);
    }
  });

  it('search finds by Russian name, English name and the char itself', () => {
    expect(searchSymbols('тире').some((s) => s.char === '—')).toBe(true);
    expect(searchSymbols('dash').some((s) => s.char === '—')).toBe(true);
    expect(searchSymbols('—').some((s) => s.char === '—')).toBe(true);
    expect(searchSymbols('rouble').some((s) => s.char === '₽')).toBe(true);
  });

  it('empty query returns everything, junk query returns nothing', () => {
    expect(searchSymbols('').length).toBe(SYMBOLS.length);
    expect(searchSymbols('zzzznotasymbol').length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Symbol favorites / recent storage (local to the tool)
// ---------------------------------------------------------------------------

function makeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

describe('typograf storage', () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).localStorage = makeLocalStorage();
  });

  it('toggles favorites on and off', () => {
    expect(loadSymbolFavorites()).toEqual([]);
    expect(toggleSymbolFavorite('—')).toEqual(['—']);
    expect(toggleSymbolFavorite('₽')).toEqual(['—', '₽']);
    expect(toggleSymbolFavorite('—')).toEqual(['₽']);
    expect(loadSymbolFavorites()).toEqual(['₽']);
  });

  it('settings round-trip and merge with defaults', () => {
    const s = loadTypografSettings();
    expect(s.language).toBe('auto');
    expect(s.categories.yo).toBe(false);
    saveTypografSettings({ ...s, language: 'ru', categories: { ...s.categories, yo: true } });
    const s2 = loadTypografSettings();
    expect(s2.language).toBe('ru');
    expect(s2.categories.yo).toBe(true);
    expect(s2.categories.quotes).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function onlyCats(...on: string[]): Record<string, boolean> {
  const all = Object.fromEntries(Object.keys(DEFAULT_CATEGORIES).map((k) => [k, false]));
  for (const k of on) all[k] = true;
  return all;
}

// ---------------------------------------------------------------------------
// Reference tests (§39 of the spec). NBSP/NNBSP are real U+00A0/U+202F in
// the output — `vis()` normalizes them to plain spaces so the assertions
// stay readable; dedicated tests above check the actual characters.
// ---------------------------------------------------------------------------

function vis(s: string): string {
  return s.replace(/[  ]/g, ' ');
}

describe('typograf: reference tests (§39)', () => {
  it('T1: базовая очистка', () => {
    expect(
      vis(typograf('"Привет" , мир ! Это тестовый пример для статьи про типографику .')),
    ).toBe('«Привет», мир! Это тестовый пример для статьи про типографику.');
  });

  it('T2: даты и валюта (aggressive)', () => {
    expect(
      vis(
        typograf(
          'Новая модель смартфона поступит в продажу 12.05.2026 г. по цене всего 899$.',
          { aggressive: true },
        ),
      ),
    ).toBe('Новая модель смартфона поступит в продажу 12 мая 2026 года по цене всего 899 $.');
  });

  it('T2b: без aggressive числовая дата сохраняется', () => {
    expect(vis(typograf('поступит в продажу 12.05.2026 г. по цене 899$.'))).toBe(
      'поступит в продажу 12.05.2026 г. по цене 899 $.',
    );
  });

  it('T3: единицы и десятичная запятая', () => {
    // Отступление от эталона: «дюймов» НЕ склоняется в «дюйма» — это
    // морфологическая правка, меняющая слово (запрещено §38).
    expect(vis(typograf('Телефон весит 180г , имеет экран 6.5 дюймов.'))).toBe(
      'Телефон весит 180 г, имеет экран 6,5 дюймов.',
    );
  });

  it('T4: мАч → мА·ч', () => {
    expect(vis(typograf('4500 мАч'))).toBe('4 500 мА·ч');
    expect(vis(typograf('батарею на 4500мАч'))).toBe('батарею на 4 500 мА·ч');
  });

  it('T5: телефон', () => {
    expect(vis(typograf('+7(999)123-45-67'))).toBe('+7 999 123-45-67');
  });

  it('T6: время 9-00 → 9:00', () => {
    expect(vis(typograf('с 9-00 до 18-00'))).toBe('с 9:00 до 18:00');
  });

  it('T7: номер и сокращения', () => {
    expect(vis(typograf('Постановление N342/б-12 : в соответствии с п.3 ст.12'))).toBe(
      'Постановление № 342/б-12: в соответствии с п. 3 ст. 12',
    );
  });

  it('T8: математика', () => {
    expect(vis(typograf('A=b*c+d (где d > = 5).', { language: 'ru' }))).toBe(
      'A = b × c + d (где d ≥ 5).',
    );
  });

  it('T9: вариант «А» (люкс) — 5000 руб./мес.', () => {
    expect(vis(typograf('вариант "А" ( люкс ) : 5000руб/мес..'))).toBe(
      'вариант «А» (люкс) — 5 000 руб./мес.',
    );
  });

  it('T10: вариант «Б» [эконом] — 2500 руб. за 1 мес.', () => {
    expect(vis(typograf("вариант 'Б' [ эконом ] : 2500р. за 1 мес.."))).toBe(
      'вариант «Б» [эконом] — 2 500 руб. за 1 мес.',
    );
  });

  it('Пример 3: Конституция РФ и диапазон 10...15', () => {
    expect(
      vis(typograf('в соответствии с п.3 ст.12 конституции РФ каждый гражданин имеет право на 10...15 минут отдыха .Формула')),
    ).toBe(
      'в соответствии с п. 3 ст. 12 Конституции РФ каждый гражданин имеет право на 10—15 минут отдыха. Формула',
    );
  });
});

// ---------------------------------------------------------------------------
// Time (§16, §17)
// ---------------------------------------------------------------------------

describe('typograf: time', () => {
  it('converts 9-00 to 9:00 but keeps numeric ranges', () => {
    expect(typograf('9-00', { categories: onlyCats('time') })).toBe('9:00');
    expect(typograf('18-00', { categories: onlyCats('time') })).toBe('18:00');
    expect(typograf('5-10 минут', { categories: onlyCats('time') })).toBe('5-10 минут');
  });

  it('formats time ranges without spaces (§17)', () => {
    expect(typograf('9:00 - 18:00', { categories: onlyCats('time') })).toBe('9:00–18:00');
    expect(typograf('9:00 — 18:00', { categories: onlyCats('time') })).toBe('9:00–18:00');
  });

  it('does not add a space inside 9:00 (§3)', () => {
    expect(typograf('открыто с 9:00', { categories: onlyCats('spaces') })).toBe('открыто с 9:00');
  });
});

// ---------------------------------------------------------------------------
// Math expressions (§22, §23) — single-char operands only
// ---------------------------------------------------------------------------

describe('typograf: math expressions', () => {
  it('formats A=b*c+d but never Ctrl+C', () => {
    expect(typograf('A=b*c+d', { language: 'en', categories: onlyCats('math') })).toBe(
      'A = b × c + d',
    );
    expect(typograf('press Ctrl+C now', { language: 'en', categories: onlyCats('math') })).toBe(
      'press Ctrl+C now',
    );
  });

  it('tolerates spaces inside comparison signs ("> =" → ≥)', () => {
    expect(typograf('d > = 5 и x < = 2', { categories: onlyCats('math') })).toBe('d ≥ 5 и x ≤ 2');
  });
});

// ---------------------------------------------------------------------------
// Numero & abbreviations (§18, §19, §20, §28)
// ---------------------------------------------------------------------------

describe('typograf: numero & abbreviations', () => {
  it('N342 → № 342 in Russian text only', () => {
    expect(vis(typograf('приказ N342', { categories: onlyCats('numero') }))).toBe('приказ № 342');
    expect(vis(typograf('№342', { categories: onlyCats('numero') }))).toBe('№ 342');
    expect(typograf('vitamin N342b', { language: 'en', categories: onlyCats('numero') })).toBe(
      'vitamin N342b',
    );
  });

  it('п.3 → п. 3 with nbsp (§19)', () => {
    expect(typograf('см. п.3 и ст.12', { categories: onlyCats('abbrev') })).toBe(
      `см.${NBSP}п.${NBSP}3 и ст.${NBSP}12`,
    );
  });

  it('руб/мес → руб./мес. (§28)', () => {
    expect(vis(typograf('5000 руб/мес'))).toBe('5 000 руб./мес.');
  });

  it('тел. expands only in aggressive mode (§15)', () => {
    expect(vis(typograf('звоните по тел. +7(999)123-45-67'))).toContain('по тел. +7');
    expect(vis(typograf('звоните по тел. +7(999)123-45-67', { aggressive: true }))).toContain(
      'по телефону +7',
    );
  });
});

// ---------------------------------------------------------------------------
// Units (§11, §12)
// ---------------------------------------------------------------------------

describe('typograf: units', () => {
  it('adds the missing space: 180г → 180 г (nbsp)', () => {
    expect(typograf('вес 180г', { categories: onlyCats('units') })).toBe(`вес 180${NBSP}г`);
    expect(typograf('до 25кг и 10км', { categories: onlyCats('units') })).toBe(
      `до 25${NBSP}кг и 10${NBSP}км`,
    );
  });

  it('does not split real words (2026год is not a unit context)', () => {
    expect(typograf('в 2026году', { categories: onlyCats('units') })).toBe('в 2026году');
  });

  it('мАч and mAh → мА·ч with the middle dot (§12)', () => {
    expect(typograf('4500 мАч', { categories: onlyCats('units') })).toBe(`4500${NBSP}мА·ч`);
    expect(typograf('4500 mAh', { language: 'ru', categories: onlyCats('units') })).toBe(
      `4500${NBSP}мА·ч`,
    );
  });
});

// ---------------------------------------------------------------------------
// Structure preservation (§32)
// ---------------------------------------------------------------------------

describe('typograf: structure preservation', () => {
  it('keeps numbered lists on separate lines', () => {
    const list = '1. Первый пункт\n2. Второй пункт\n3. Третий пункт';
    expect(typograf(list)).toBe(list);
  });

  it('keeps markdown bullet lists (no direct-speech dash)', () => {
    const list = '- первый пункт\n- второй пункт\n- третий пункт';
    expect(typograf(list)).toBe(list);
  });

  it('still formats single-line direct speech', () => {
    expect(vis(typograf('- Привет!\nОн вошёл.'))).toBe('— Привет!\nОн вошёл.');
  });

  it('keeps paragphs (double newline) while collapsing 3+', () => {
    expect(typograf('Абзац раз.\n\nАбзац два.')).toBe('Абзац раз.\n\nАбзац два.');
    expect(typograf('Абзац раз.\n\n\n\nАбзац два.')).toBe('Абзац раз.\n\nАбзац два.');
  });
});

// ---------------------------------------------------------------------------
// Aggressive mode (§36) & stats (§35)
// ---------------------------------------------------------------------------

describe('typograf: aggressive mode & stats', () => {
  it('expands dates only when aggressive', () => {
    expect(vis(typograf('срок 12.05.2026', { aggressive: true }))).toBe('срок 12 мая 2026 года');
    expect(vis(typograf('срок 12.05.2026'))).toBe('срок 12.05.2026');
  });

  it('never expands technical version-like dates (§8)', () => {
    expect(vis(typograf('version 12.05.2026 released', { language: 'ru', aggressive: true }))).toBe(
      'version 12.05.2026 released',
    );
  });

  it('reports which categories fired (§35)', () => {
    const res = typografDetailed('"Привет" , мир !');
    expect(res.text).toBe('«Привет», мир!');
    expect(res.fired.quotes).toBeGreaterThan(0);
    expect(res.fired.spaces).toBeGreaterThan(0);
    expect(res.fired.phones).toBeUndefined();
  });

  it('aggressive run stays idempotent (§34)', () => {
    const src = 'Постановление N342 : тел. +7(999)123-45-67 , цена 5000руб с 9-00 до 18-00 12.05.2026 г.';
    const once = typograf(src, { aggressive: true });
    expect(typograf(once, { aggressive: true })).toBe(once);
  });
});

// ---------------------------------------------------------------------------
// Rule metadata contract (§40)
// ---------------------------------------------------------------------------

describe('typograf: rule metadata (§40)', () => {
  it('every rule has a unique id, a name and a valid category', () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RULES) {
      expect(r.name.length).toBeGreaterThan(0);
      expect(RULE_CATEGORIES).toContain(r.category);
      expect(typeof r.priority).toBe('number');
    }
  });

  it('RULES are sorted by priority (deterministic pipeline, §37)', () => {
    for (let i = 1; i < RULES.length; i++) {
      expect(RULES[i].priority).toBeGreaterThanOrEqual(RULES[i - 1].priority);
    }
  });
});

// ---------------------------------------------------------------------------
// Contextual typography (доработка: правила, контекст и безопасная обработка)
// ---------------------------------------------------------------------------

describe('typograf: negative numbers stay negative (§4.3)', () => {
  it('never turns a minus before a number into a dash', () => {
    expect(vis(typograf('температура -12 °C утром'))).toBe('температура -12 °C утром');
    // ru: nbsp appears before %, but the minus stays a minus
    expect(vis(typograf('скидка -20% сегодня'))).toBe('скидка -20 % сегодня');
    expect(vis(typograf('баланс -100 ₽ на счету'))).toBe('баланс -100 ₽ на счету');
  });

  it('still converts a spaced hyphen and a range on the same line', () => {
    expect(vis(typograf('ветра - 5-7 м/с'))).toBe('ветра — 5–7 м/с');
  });
});

describe('typograf: context-aware number grouping (§5)', () => {
  it('groups from 4 digits: 1000 → 1 000', () => {
    expect(vis(typograf('более 1000 пользователей'))).toBe('более 1 000 пользователей');
    expect(vis(typograf('15000 пользователей'))).toBe('15 000 пользователей');
    expect(vis(typograf('2500000 рублей'))).toBe('2 500 000 рублей');
  });

  it('keeps years, год-context and № numbers intact', () => {
    expect(vis(typograf('в 2026 году'))).toBe('в 2026 году');
    expect(vis(typograf('с 2020 по 2026 год'))).toBe('с 2020 по 2026 год');
    expect(vis(typograf('приказ № 1234 подписан'))).toBe('приказ № 1234 подписан');
  });

  it('keeps technical sizes next to × (1920 × 1080)', () => {
    expect(vis(typograf('экран 1920 x 1080 пикселей'))).toBe('экран 1920 × 1080 пикселей');
  });

  it('groups a year-like number when a currency follows (1999 ₽)', () => {
    expect(vis(typograf('всего 1999 ₽ за штуку'))).toBe('всего 1 999 ₽ за штуку');
  });

  it('does not touch already correct 15 000 ₽', () => {
    const once = typograf('цена 15 000 ₽');
    expect(vis(once)).toBe('цена 15 000 ₽');
    expect(typograf(once)).toBe(once);
  });
});

describe('typograf: decimals vs partial dates (§6, §10.1)', () => {
  it('converts real decimals but keeps «с 25.08 по …» dates', () => {
    expect(vis(typograf('вес 25.5 кг'))).toBe('вес 25,5 кг');
    expect(vis(typograf('действует с 25.08 по 31.08.2026'))).toBe(
      'действует с 25.08 по 31.08.2026',
    );
  });
});

describe('typograf: date ranges (aggressive, §10)', () => {
  it('«с 25.08 по 31.08.2026» → «с 25 по 31 августа 2026 года»', () => {
    expect(vis(typograf('Распродажа действует с 25.08 по 31.08.2026.', { aggressive: true }))).toBe(
      'Распродажа действует с 25 по 31 августа 2026 года.',
    );
  });

  it('different months are both expanded', () => {
    expect(vis(typograf('открыто с 28.08 по 02.09.2026', { aggressive: true }))).toBe(
      'открыто с 28 августа по 2 сентября 2026 года',
    );
  });

  it('«с 2020-2026 гг.» → «с 2020 по 2026 год»', () => {
    expect(vis(typograf('работает с 2020-2026 гг. и растёт', { aggressive: true }))).toBe(
      'работает с 2020 по 2026 год и растёт',
    );
  });

  it('conservative mode leaves «с 2020-2026 гг.» untouched (no en dash)', () => {
    expect(vis(typograf('работает с 2020-2026 гг. и растёт'))).toBe(
      'работает с 2020-2026 гг. и растёт',
    );
  });
});

describe('typograf: nested quotes (§3.1)', () => {
  it('«Он сказал: „Привет“» pattern', () => {
    expect(
      vis(typograf('Иван сказал: "Посмотри статью "Как правильно писать тексты?""')),
    ).toBe('Иван сказал: «Посмотри статью „Как правильно писать тексты?“»');
  });
});

describe('typograf: technical content protection (§22)', () => {
  it('keeps snake_case identifiers, CSS declarations and code lines', () => {
    expect(typograf('поле user_id обязательно')).toContain('user_id');
    expect(typograf('стиль font-size: 16px; задан')).toContain('font-size: 16px;');
    const code = 'const value = "test";';
    expect(typograf(code, { language: 'ru' })).toBe(code);
  });

  it('URLs with hyphens survive dash rules', () => {
    const url = 'https://example.com/test-page?a=1-2';
    expect(typograf(`смотри ${url} тут`)).toContain(url);
  });
});

// ---------------------------------------------------------------------------
// Mandatory test (§29) — the full scenario, aggressive mode
// ---------------------------------------------------------------------------

describe('typograf: mandatory scenario (§29)', () => {
  const INPUT = [
    'Он сказал: "Я вернусь через 5-10 минут"... Но так и не вернулся.',
    '',
    'Компания работает с 2020-2026 гг. и выпустила более 1000 продуктов.',
    '',
    'Цена товара - 1999 руб. вместо 2499 руб.',
    '',
    'Распродажа действует с 25.08 по 31.08.2026.',
    '',
    'Температура воздуха составила -12 °C, а скорость ветра - 5-7 м/с.',
    '',
    '1000 пользователей',
    '15000 пользователей',
    '2500000 рублей',
    '',
    '15 000 ₽',
    '2 499 ₽',
    '',
    '1920 x 1080',
    '10 км',
    '5 кг',
    '-12 °C',
    '5-7 м/с',
    '',
    '09:30-18:00',
    '',
    'https://example.com/test-page',
    'hello@example.com',
    '',
    'iPhone 17',
    'MacBook Pro 16',
    'Figma',
    'ChatGPT',
    'AI',
    'UI/UX',
    'e-commerce',
    'design system',
  ].join('\n');

  const EXPECTED = [
    'Он сказал: «Я вернусь через 5–10 минут»… Но так и не вернулся.',
    '',
    'Компания работает с 2020 по 2026 год и выпустила более 1 000 продуктов.',
    '',
    'Цена товара — 1 999 ₽ вместо 2 499 ₽.',
    '',
    'Распродажа действует с 25 по 31 августа 2026 года.',
    '',
    'Температура воздуха составила -12 °C, а скорость ветра — 5–7 м/с.',
    '',
    '1 000 пользователей',
    '15 000 пользователей',
    '2 500 000 рублей',
    '',
    '15 000 ₽',
    '2 499 ₽',
    '',
    '1920 × 1080',
    '10 км',
    '5 кг',
    '-12 °C',
    '5–7 м/с',
    '',
    '09:30–18:00',
    '',
    'https://example.com/test-page',
    'hello@example.com',
    '',
    'iPhone 17',
    'MacBook Pro 16',
    'Figma',
    'ChatGPT',
    'AI',
    'UI/UX',
    'e-commerce',
    'design system',
  ].join('\n');

  it('produces the expected result (aggressive mode)', () => {
    expect(vis(typograf(INPUT, { aggressive: true }))).toBe(EXPECTED);
  });

  it('is idempotent on the full scenario', () => {
    const once = typograf(INPUT, { aggressive: true });
    expect(typograf(once, { aggressive: true })).toBe(once);
  });

  it('conservative mode also never breaks the technical lines', () => {
    const out = typograf(INPUT);
    expect(out).toContain('https://example.com/test-page');
    expect(out).toContain('hello@example.com');
    expect(out).toContain('iPhone 17');
    expect(out).toContain('UI/UX');
    expect(vis(out)).toContain('-12 °C');
  });
});

// ---------------------------------------------------------------------------
// diffChanges (§25 «Показать изменения»)
// ---------------------------------------------------------------------------

describe('typograf: diffChanges', () => {
  it('collects «было → стало» pairs', () => {
    const src = '"Привет" , мир ! Диапазон 5-10 дней';
    const out = typograf(src);
    const pairs = diffChanges(src, out)!;
    expect(pairs.length).toBeGreaterThan(0);
    const flat = pairs.map((p) => `${p.from} → ${p.to}`).join(' | ');
    expect(flat).toContain('«Привет»,');
    expect(flat).toContain('5–10');
  });

  it('returns an empty list when nothing changed', () => {
    expect(diffChanges('привет мир', 'привет мир')).toEqual([]);
  });

  it('bails out on huge texts instead of freezing', () => {
    const huge = Array.from({ length: 2000 }, (_, i) => `слово${i}`).join(' ');
    expect(diffChanges(huge, huge + ' x')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Competitor-parity rules (v0.13.0)
// ---------------------------------------------------------------------------

describe('typograf: competitor-parity rules', () => {
  it('removes spaces just inside quotes: « текст » → «текст»', () => {
    expect(typograf('он сказал « привет » нам', { categories: onlyCats('spaces') })).toBe(
      'он сказал «привет» нам',
    );
  });

  it('converts <<ёлочки>> and “лапки” to «ёлочки» in Russian', () => {
    expect(typograf('он сказал <<привет>> нам', { categories: onlyCats('quotes') })).toBe(
      'он сказал «привет» нам',
    );
    expect(typograf('он сказал “привет” нам', { categories: onlyCats('quotes') })).toBe(
      'он сказал «привет» нам',
    );
  });

  it('deduplicates doubled guillemets', () => {
    expect(typograf('««привет»»', { categories: onlyCats('quotes') })).toBe('«привет»');
  });

  it('collapses doubled service words: «в в тексте» → «в тексте»', () => {
    expect(typograf('ошибка в в тексте', { categories: onlyCats('punctuation') })).toBe(
      'ошибка в тексте',
    );
    // meaningful repeats stay
    expect(typograf('это было очень очень давно', { categories: onlyCats('punctuation') })).toBe(
      'это было очень очень давно',
    );
  });

  it('turns an attached dash before a digit back into a minus: –5°C → -5°C', () => {
    expect(vis(typograf('температура –5 °C', { categories: onlyCats('dashes') }))).toBe(
      'температура -5 °C',
    );
    expect(vis(typograf('температура —5 °C', { categories: onlyCats('dashes') }))).toBe(
      'температура -5 °C',
    );
    // ranges keep the en dash
    expect(typograf('120–130', { categories: onlyCats('dashes') })).toBe('120–130');
  });

  it('non-breaking hyphen inside word repeats: еле-еле', () => {
    expect(typograf('шёл еле-еле домой', { categories: onlyCats('dashes') })).toBe(
      'шёл еле‑еле домой',
    );
  });

  it('fixes wrongly grouped 4-digit years/px: 2 026 год → 2026 год', () => {
    expect(vis(typograf('в 2 026 год вошли', { categories: onlyCats('numbers') }))).toBe(
      'в 2026 год вошли',
    );
    expect(vis(typograf('экран 1 920 px', { categories: onlyCats('numbers') }))).toBe(
      'экран 1920 px',
    );
  });

  it('moves the ₽ sign after the amount: ₽100 → 100 ₽', () => {
    expect(typograf('цена ₽100 сегодня', { categories: onlyCats('currency') })).toBe(
      `цена 100${NBSP}₽ сегодня`,
    );
  });

  it('glues ordinals, numbers and time-of-day marks with nbsp', () => {
    expect(typograf('ученик 5-й класс', { categories: onlyCats('nbsp') })).toBe(
      `ученик 5-й${NBSP}класс`,
    );
    expect(typograf('всего 8 блоков', { categories: onlyCats('nbsp') })).toBe(
      `всего 8${NBSP}блоков`,
    );
    expect(typograf('встреча в 10:30 утра', { categories: onlyCats('nbsp') })).toBe(
      `встреча в 10:30${NBSP}утра`,
    );
  });

  it('formats surname-first initials: Петров А.С. → Петров А. С.', () => {
    expect(typograf('доклад Петров А.С. готов', { categories: onlyCats('nbsp') })).toBe(
      `доклад Петров${NBSP}А.${NBSP}С. готов`,
    );
  });

  it('glues см./ср./напр. to the next word', () => {
    expect(typograf('см. раздел выше', { categories: onlyCats('abbrev') })).toBe(
      `см.${NBSP}раздел выше`,
    );
  });
});

describe('typograf symbols: new categories (v0.13.0)', () => {
  it('has keyboard, checks, stars and bullets categories with symbols', () => {
    for (const cat of ['keyboard', 'checks', 'stars', 'bullets'] as const) {
      expect(SYMBOL_CATEGORIES).toContain(cat);
      expect(SYMBOLS.filter((s) => s.category === cat).length).toBeGreaterThanOrEqual(8);
    }
  });

  it('search finds the new symbols', () => {
    expect(searchSymbols('command').some((s) => s.char === '⌘')).toBe(true);
    expect(searchSymbols('галочка').some((s) => s.char === '✓')).toBe(true);
    expect(searchSymbols('манат').some((s) => s.char === '₼')).toBe(true);
    expect(searchSymbols('маркер').some((s) => s.char === '•')).toBe(true);
  });

  it('library grew to 150+ symbols', () => {
    expect(SYMBOLS.length).toBeGreaterThanOrEqual(150);
  });
});

// ---------------------------------------------------------------------------
// English rules (v0.14.0 — competitor parity for «Язык текста: английский»)
// ---------------------------------------------------------------------------

describe('typograf: english rules', () => {
  it('groups big numbers with commas: 10000 → 10,000', () => {
    expect(typograf('over 10000 users', { language: 'en', categories: onlyCats('numbers') })).toBe(
      'over 10,000 users',
    );
    expect(typograf('1000000 records', { language: 'en', categories: onlyCats('numbers') })).toBe(
      '1,000,000 records',
    );
    // 4-digit numbers stay solid
    expect(typograf('1920 px and 2025 year', { language: 'en', categories: onlyCats('numbers') })).toBe(
      '1920 px and 2025 year',
    );
  });

  it('capitalizes weekdays and unambiguous months', () => {
    expect(typograf('see you on monday in january', { language: 'en', categories: onlyCats('dates') })).toBe(
      'see you on Monday in January',
    );
    // march / may / august are ordinary words — untouched
    expect(typograf('we march in may', { language: 'en', categories: onlyCats('dates') })).toBe(
      'we march in may',
    );
  });

  it('glues initials, honorifics, AM/PM and ordinals with nbsp', () => {
    expect(typograf('J. R. R. Tolkien wrote', { language: 'en', categories: onlyCats('nbsp') })).toBe(
      `J.${NBSP}R.${NBSP}R.${NBSP}Tolkien wrote`,
    );
    expect(typograf('ask Dr. House now', { language: 'en', categories: onlyCats('nbsp') })).toBe(
      `ask Dr.${NBSP}House now`,
    );
    expect(typograf('open at 10:30 AM today', { language: 'en', categories: onlyCats('nbsp') })).toBe(
      `open at 10:30${NBSP}AM today`,
    );
    expect(typograf('on the 5th floor', { language: 'en', categories: onlyCats('nbsp') })).toBe(
      `on the 5th${NBSP}floor`,
    );
  });

  it('glues English service words forward (hanging)', () => {
    expect(typograf('made from scratch with care', { language: 'en', categories: onlyCats('hanging') })).toBe(
      `made from${NBSP}scratch with${NBSP}care`,
    );
    expect(typograf('the app and the site', { language: 'en', categories: onlyCats('hanging') })).toBe(
      `the${NBSP}app and${NBSP}the${NBSP}site`,
    );
  });

  it('stays idempotent on an english paragraph', () => {
    const src = 'Dr. Smith said: "We ship 10000 units from May 10, 2025 at 10:30 AM on the 3rd floor."';
    const once = typograf(src, { language: 'en' });
    expect(typograf(once, { language: 'en' })).toBe(once);
  });
});

// ---------------------------------------------------------------------------
// English etalon (v0.15.0 — user-provided sample must match exactly)
// ---------------------------------------------------------------------------

describe('typograf: english etalon sample (v0.15.0)', () => {
  const src = [
    `"To be, or not to be \u2014 that is the question," said Hamlet 'the Dane' in Act 3, Scene 1.`,
    `It's a well-known quote (approx. 1599\u20131601) by Shakespeare.`,
    `Prices range from $10.50 \u2013 $20.00 (a 50%-75% increase).`,
    `Dr. Smith walked 5 km in 1.5 hours, and he said: "I'm 'ready' for the 2nd round!"`,
  ].join('\n');

  const ideal = [
    `\u201cTo be, or not to be \u2014 that is the question,\u201d said Hamlet \u2018the Dane\u2019 in Act 3, Scene 1.`,
    `It\u2019s a well-known quote (approx. 1599\u20131601) by Shakespeare.`,
    `Prices range from $10.50\u2013$20.00 (a 50%\u201375% increase).`,
    `Dr. Smith walked 5 km in 1.5 hours, and he said: \u201cI\u2019m \u2018ready\u2019 for the 2nd round!\u201d`,
  ].join('\n');

  it('matches the ideal output exactly (line breaks preserved)', () => {
    const out = typograf(src, { language: 'en' });
    expect(vis(out)).toBe(ideal);
    expect(out.split('\n').length).toBe(4);
  });

  it('is idempotent on the sample', () => {
    const once = typograf(src, { language: 'en' });
    expect(typograf(once, { language: 'en' })).toBe(once);
  });

  it('pairs straight single quotes in en without touching apostrophes', () => {
    expect(typograf(`Hamlet 'the Dane' spoke`, { language: 'en', categories: onlyCats('quotes') })).toBe(
      `Hamlet \u2018the Dane\u2019 spoke`,
    );
    // apostrophes never pair, even with the punctuation category off
    expect(typograf(`it's Bob's book`, { language: 'en', categories: onlyCats('quotes') })).toBe(
      `it's Bob's book`,
    );
  });

  it('collapses a spaced dash between numbers into an en dash range', () => {
    expect(typograf('from 10 - 20 days', { language: 'en', categories: onlyCats('dashes') })).toBe(
      'from 10\u201320 days',
    );
    expect(typograf('$10.50 \u2013 $20.00', { language: 'en', categories: onlyCats('dashes') })).toBe(
      '$10.50\u2013$20.00',
    );
    // prose em dash keeps its spaces — the right side is not a number
    expect(typograf('It was 1999 \u2014 a great year', { language: 'en', categories: onlyCats('dashes') })).toBe(
      'It was 1999 \u2014 a great year',
    );
    // «с 2020 — 2026» is a «с … по …» construction — untouched (ru guard)
    expect(vis(typograf('\u0441 2020 \u2014 2026', { language: 'ru', categories: onlyCats('dashes') }))).toBe(
      '\u0441 2020 \u2014 2026',
    );
  });

  it('en-dashes percent and currency ranges', () => {
    expect(typograf('a 50%-75% increase', { language: 'en', categories: onlyCats('dashes') })).toBe(
      'a 50%\u201375% increase',
    );
    expect(typograf('pay $10-$20 now', { language: 'en', categories: onlyCats('dashes') })).toBe(
      'pay $10\u2013$20 now',
    );
    // and the result never regresses to a minus on the second run
    expect(typograf('a 50%\u201375% increase', { language: 'en', categories: onlyCats('dashes') })).toBe(
      'a 50%\u201375% increase',
    );
  });
});

describe('typograf: percent spacing (v0.16.0)', () => {
  it('ru: nbsp between number and %', () => {
    expect(typograf('\u0441\u043a\u0438\u0434\u043a\u0430 5%', { language: 'ru', categories: onlyCats('spaces') })).toBe(
      '\u0441\u043a\u0438\u0434\u043a\u0430 5\u00A0%',
    );
    expect(typograf('\u0440\u043e\u0441\u0442 25 %', { language: 'ru', categories: onlyCats('spaces') })).toBe(
      '\u0440\u043e\u0441\u0442 25\u00A0%',
    );
  });

  it('en: % stays tight to the number', () => {
    expect(typograf('growth of 25 %', { language: 'en', categories: onlyCats('spaces') })).toBe('growth of 25%');
    expect(typograf('growth of 25%', { language: 'en', categories: onlyCats('spaces') })).toBe('growth of 25%');
  });

  it('ru percent ranges keep the en dash with the new spacing', () => {
    expect(vis(typograf('\u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d 50%-75%', { language: 'ru' }))).toBe(
      '\u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d 50 %\u201375 %',
    );
  });
});

describe('typograf: technical data is preserved verbatim (v0.16.0)', () => {
  it('keeps URLs, emails, domains untouched', () => {
    const s = '\u0441\u043c. https://ex.com/a-b_c?x=1,5&y=2.4 \u0438 \u043f\u0438\u0448\u0438 \u043d\u0430 dev_ops@mail.example.com';
    const out = typograf(s);
    expect(out).toContain('https://ex.com/a-b_c?x=1,5&y=2.4');
    expect(out).toContain('dev_ops@mail.example.com');
  });

  it('keeps IP addresses, git hashes and UUIDs untouched', () => {
    const s = '\u0445\u043e\u0441\u0442 192.168.10.15, \u043a\u043e\u043c\u043c\u0438\u0442 d2b4e382ed, id 5f344634-18b2-433d-8380-a65d8fc62992';
    const out = typograf(s);
    expect(out).toContain('192.168.10.15');
    expect(out).toContain('d2b4e382ed');
    expect(out).toContain('5f344634-18b2-433d-8380-a65d8fc62992');
  });

  it('hash protection never eats plain words or plain numbers', () => {
    expect(typograf('decade of 1000000 facts', { language: 'en', categories: onlyCats('numbers') })).toBe(
      'decade of 1,000,000 facts',
    );
  });
});

describe('typograf: formatting line breaks join into the sentence (v0.16.0)', () => {
  it('joins a hard-wrapped sentence with spaces', () => {
    const src = '\u042d\u0442\u043e \u0434\u043b\u0438\u043d\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435, \u043a\u043e\u0442\u043e\u0440\u043e\u0435 \u0431\u044b\u043b\u043e \u0436\u0451\u0441\u0442\u043a\u043e\n\u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u043e \u043f\u043e \u0448\u0438\u0440\u0438\u043d\u0435 \u043a\u043e\u043b\u043e\u043d\u043a\u0438.';
    const out = typograf(src, { categories: onlyCats('spaces') });
    expect(out.includes('\n')).toBe(false);
    expect(vis(out)).toContain('\u0436\u0451\u0441\u0442\u043a\u043e \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u043e');
  });

  it('never joins word-per-line lists, paragraphs, markdown lists or short lines', () => {
    const list = '\u044f\u0431\u043b\u043e\u043a\u043e\n\u0431\u0430\u043d\u0430\u043d\n\u0432\u0438\u0448\u043d\u044f';
    expect(typograf(list, { categories: onlyCats('spaces') })).toBe(list);
    const paras = '\u041f\u0435\u0440\u0432\u044b\u0439 \u0430\u0431\u0437\u0430\u0446.\n\n\u0412\u0442\u043e\u0440\u043e\u0439 \u0430\u0431\u0437\u0430\u0446.';
    expect(typograf(paras, { categories: onlyCats('spaces') })).toBe(paras);
  });
});

describe('typograf: formulas, list dots, redundancy (v0.17.0)', () => {
  it('subscripts whitelisted chemical formulas only', () => {
    expect(typograf('\u0432\u043e\u0434\u0430 H2O \u0438 \u0433\u0430\u0437 CO2', { categories: onlyCats('specials') })).toBe(
      '\u0432\u043e\u0434\u0430 H\u2082O \u0438 \u0433\u0430\u0437 CO\u2082',
    );
    expect(typograf('\u043f\u0435\u0440\u0435\u043a\u0438\u0441\u044c H2O2, \u0433\u043b\u044e\u043a\u043e\u0437\u0430 C6H12O6', { categories: onlyCats('specials') })).toBe(
      '\u043f\u0435\u0440\u0435\u043a\u0438\u0441\u044c H\u2082O\u2082, \u0433\u043b\u044e\u043a\u043e\u0437\u0430 C\u2086H\u2081\u2082O\u2086',
    );
    const skip = 'B2B \u0438 A4 \u0438 MP3 \u0438 C3PO';
    expect(typograf(skip, { categories: onlyCats('specials') })).toBe(skip);
  });

  it('converts the full unicode fraction set, guarded', () => {
    expect(typograf('\u0432\u043e\u0437\u044c\u043c\u0438 1/5 \u0438 5/6', { categories: onlyCats('numbers') })).toBe(
      '\u0432\u043e\u0437\u044c\u043c\u0438 \u2155 \u0438 \u215A',
    );
    expect(typograf('\u0441\u0447\u0451\u0442 21/22', { categories: onlyCats('numbers') })).toBe('\u0441\u0447\u0451\u0442 21/22');
  });

  it('+/- and cyrillic (\u0441) become glyphs', () => {
    expect(typograf('\u043f\u043e\u0433\u0440\u0435\u0448\u043d\u043e\u0441\u0442\u044c +/- 5', { categories: onlyCats('math') })).toBe(
      '\u043f\u043e\u0433\u0440\u0435\u0448\u043d\u043e\u0441\u0442\u044c \u00b1 5',
    );
    expect(typograf('(\u0441) 2026', { categories: onlyCats('specials') })).toBe('\u00a9 2026');
  });

  it('adds missing spaces in address abbreviations and list markers', () => {
    expect(vis(typograf('\u0443\u043b. \u041b\u0435\u043d\u0438\u043d\u0430, \u0434.5, \u043a\u0432.2.'))).toBe(
      '\u0443\u043b. \u041b\u0435\u043d\u0438\u043d\u0430, \u0434. 5, \u043a\u0432. 2.',
    );
    expect(vis(typograf('1.\u0425\u043b\u0435\u0431\n2.\u041c\u043e\u043b\u043e\u043a\u043e'))).toBe(
      '1. \u0425\u043b\u0435\u0431\n2. \u041c\u043e\u043b\u043e\u043a\u043e',
    );
    // decimals never fire
    expect(vis(typograf('\u0446\u0435\u043d\u0430 1.5', { categories: onlyCats('punctuation') }))).toBe('\u0446\u0435\u043d\u0430 1.5');
  });

  it('cleans textual markers left next to glyphs', () => {
    expect(vis(typograf('\u00a9 (\u0441) \u041a\u043e\u043c\u043f\u0430\u043d\u0438\u044f'))).toBe(
      '\u00a9 \u041a\u043e\u043c\u043f\u0430\u043d\u0438\u044f',
    );
    expect(vis(typograf('\u0446\u0435\u043d\u0430 100 \u20bd \u0440\u0443\u0431. \u0441\u0435\u0439\u0447\u0430\u0441'))).toBe(
      '\u0446\u0435\u043d\u0430 100 \u20bd \u0441\u0435\u0439\u0447\u0430\u0441',
    );
    expect(vis(typograf('\u00b1 +/- 5', { categories: onlyCats('specials', 'math') }))).toBe('\u00b1 5');
  });
});
