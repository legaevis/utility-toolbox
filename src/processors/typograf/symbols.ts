/**
 * Symbol Library for the Typograf's "Symbols" panel.
 *
 * Pure data, no UI logic. Names and keywords are bilingual DATA (like tool
 * keywords elsewhere in the app) — the UI shows the name for the current
 * language; search matches both languages plus the symbol itself.
 *
 * `display` is used for invisible characters: the button shows the display
 * string, but the CLIPBOARD receives the real `char`.
 */

export type SymbolCategoryId =
  | 'quotes'
  | 'dashes'
  | 'spaces'
  | 'math'
  | 'currency'
  | 'special'
  | 'arrows'
  | 'checks'
  | 'stars'
  | 'bullets'
  | 'fractions'
  | 'keyboard'
  | 'other';

export interface TypografSymbol {
  /** The exact string copied to the clipboard. */
  char: string;
  /** Visual representation for invisible characters (e.g. "[·]"). */
  display?: string;
  nameRu: string;
  nameEn: string;
  category: SymbolCategoryId;
  keywords: string[];
}

export const SYMBOL_CATEGORIES: SymbolCategoryId[] = [
  'quotes',
  'dashes',
  'spaces',
  'math',
  'currency',
  'special',
  'arrows',
  'checks',
  'stars',
  'bullets',
  'fractions',
  'keyboard',
  'other',
];

const S = (
  char: string,
  nameRu: string,
  nameEn: string,
  category: SymbolCategoryId,
  keywords: string[] = [],
  display?: string,
): TypografSymbol => ({ char, nameRu, nameEn, category, keywords, display });

export const SYMBOLS: TypografSymbol[] = [
  // Quotes
  S('«', 'Кавычка-ёлочка открывающая', 'Guillemet, opening', 'quotes', ['кавычки', 'ёлочки', 'guillemet', 'quote']),
  S('»', 'Кавычка-ёлочка закрывающая', 'Guillemet, closing', 'quotes', ['кавычки', 'ёлочки', 'guillemet', 'quote']),
  S('“', 'Английская кавычка открывающая', 'Curly quote, opening', 'quotes', ['кавычки', 'лапки', 'curly', 'quote']),
  S('”', 'Английская кавычка закрывающая', 'Curly quote, closing', 'quotes', ['кавычки', 'лапки', 'curly', 'quote']),
  S('‘', 'Одинарная кавычка открывающая', 'Single quote, opening', 'quotes', ['кавычки', 'single', 'quote']),
  S('’', 'Одинарная кавычка / апостроф', 'Single quote / apostrophe', 'quotes', ['апостроф', 'apostrophe', 'quote']),
  S('„', 'Немецкая кавычка открывающая', 'Low quote, opening', 'quotes', ['кавычки', 'лапки', 'german', 'quote']),
  S('‹', 'Одинарная ёлочка открывающая', 'Single guillemet, opening', 'quotes', ['кавычки', 'guillemet']),
  S('›', 'Одинарная ёлочка закрывающая', 'Single guillemet, closing', 'quotes', ['кавычки', 'guillemet']),
  S('《', 'Угловая скобка двойная открывающая', 'Double angle bracket, opening', 'quotes', ['кавычки', 'cjk']),
  S('》', 'Угловая скобка двойная закрывающая', 'Double angle bracket, closing', 'quotes', ['кавычки', 'cjk']),
  S('「', 'Японская кавычка открывающая', 'Corner bracket, opening', 'quotes', ['кавычки', 'cjk', 'японские']),
  S('」', 'Японская кавычка закрывающая', 'Corner bracket, closing', 'quotes', ['кавычки', 'cjk', 'японские']),
  S('『', 'Японская белая кавычка открывающая', 'White corner bracket, opening', 'quotes', ['кавычки', 'cjk']),
  S('』', 'Японская белая кавычка закрывающая', 'White corner bracket, closing', 'quotes', ['кавычки', 'cjk']),

  // Dashes
  S('-', 'Дефис', 'Hyphen', 'dashes', ['дефис', 'hyphen', 'тире']),
  S('–', 'Короткое тире (en dash)', 'En dash', 'dashes', ['тире', 'короткое тире', 'en dash', 'диапазон']),
  S('—', 'Длинное тире (em dash)', 'Em dash', 'dashes', ['тире', 'длинное тире', 'em dash']),
  S('−', 'Минус', 'Minus sign', 'dashes', ['минус', 'minus', 'математика']),

  // Spaces (invisible → explicit display)
  S(' ', 'Обычный пробел', 'Space', 'spaces', ['пробел', 'space'], '[ ]'),
  S('\u00A0', 'Неразрывный пробел (NBSP)', 'No-break space (NBSP)', 'spaces', ['пробел', 'nbsp', 'неразрывный'], '[·]'),
  S('\u202F', 'Узкий неразрывный пробел', 'Narrow no-break space', 'spaces', ['пробел', 'nnbsp', 'узкий', 'narrow'], '[‧]'),
  S('\u2009', 'Тонкий пробел', 'Thin space', 'spaces', ['пробел', 'thin', 'тонкий'], '[|]'),
  S('\u200B', 'Пробел нулевой ширины', 'Zero-width space', 'spaces', ['пробел', 'zwsp', 'zero width', 'невидимый'], '[∅]'),

  // Math
  S('±', 'Плюс-минус', 'Plus-minus', 'math', ['математика', 'plus', 'minus']),
  S('×', 'Знак умножения', 'Multiplication sign', 'math', ['умножение', 'multiply', 'x']),
  S('÷', 'Знак деления', 'Division sign', 'math', ['деление', 'divide']),
  S('=', 'Равно', 'Equals', 'math', ['равно', 'equals']),
  S('≠', 'Не равно', 'Not equal', 'math', ['не равно', 'not equal']),
  S('≈', 'Примерно равно', 'Almost equal', 'math', ['примерно', 'approx']),
  S('·', 'Средняя точка', 'Middle dot', 'math', ['точка', 'умножение', 'мА·ч', 'interpunct', 'middle dot']),
  S('≅', 'Конгруэнтно', 'Congruent', 'math', ['конгруэнтно', 'congruent']),
  S('≤', 'Меньше или равно', 'Less or equal', 'math', ['меньше', 'less']),
  S('≥', 'Больше или равно', 'Greater or equal', 'math', ['больше', 'greater']),
  S('<', 'Меньше', 'Less than', 'math', ['меньше', 'less']),
  S('>', 'Больше', 'Greater than', 'math', ['больше', 'greater']),
  S('∞', 'Бесконечность', 'Infinity', 'math', ['бесконечность', 'infinity']),
  S('√', 'Корень', 'Square root', 'math', ['корень', 'root', 'sqrt']),
  S('%', 'Процент', 'Percent', 'math', ['процент', 'percent']),
  S('‰', 'Промилле', 'Per mille', 'math', ['промилле', 'per mille']),
  S('‱', 'Промириада', 'Per ten thousand', 'math', ['промириада', 'basis point']),
  S('≡', 'Тождественно', 'Identical to', 'math', ['тождественно', 'identical']),
  S('∓', 'Минус-плюс', 'Minus-plus', 'math', ['минус', 'плюс']),

  // Currency
  S('₽', 'Рубль', 'Ruble', 'currency', ['валюта', 'рубль', 'ruble', 'rouble', 'rub']),
  S('$', 'Доллар', 'Dollar', 'currency', ['валюта', 'доллар', 'dollar', 'usd']),
  S('€', 'Евро', 'Euro', 'currency', ['валюта', 'евро', 'euro', 'eur']),
  S('£', 'Фунт стерлингов', 'Pound sterling', 'currency', ['валюта', 'фунт', 'pound', 'gbp']),
  S('¥', 'Иена / юань', 'Yen / yuan', 'currency', ['валюта', 'иена', 'юань', 'yen', 'yuan']),
  S('₩', 'Вона', 'Won', 'currency', ['валюта', 'вона', 'won']),
  S('₹', 'Рупия', 'Rupee', 'currency', ['валюта', 'рупия', 'rupee']),
  S('₺', 'Турецкая лира', 'Turkish lira', 'currency', ['валюта', 'лира', 'lira']),
  S('₴', 'Гривна', 'Hryvnia', 'currency', ['валюта', 'гривна', 'hryvnia']),
  S('₸', 'Тенге', 'Tenge', 'currency', ['валюта', 'тенге', 'tenge']),
  S('₪', 'Шекель', 'Shekel', 'currency', ['валюта', 'шекель', 'shekel']),
  S('₿', 'Биткоин', 'Bitcoin', 'currency', ['валюта', 'биткоин', 'bitcoin', 'btc', 'крипта']),

  // Special
  S('©', 'Копирайт', 'Copyright', 'special', ['копирайт', 'copyright', '(c)']),
  S('®', 'Зарегистрированный знак', 'Registered', 'special', ['registered', '(r)']),
  S('™', 'Товарный знак', 'Trademark', 'special', ['trademark', 'tm', '(tm)']),
  S('℠', 'Знак обслуживания', 'Service mark', 'special', ['service mark', 'sm']),
  S('№', 'Номер', 'Numero', 'special', ['номер', 'numero']),
  S('§', 'Параграф', 'Section sign', 'special', ['параграф', 'section']),
  S('¶', 'Знак абзаца', 'Pilcrow', 'special', ['абзац', 'pilcrow', 'paragraph']),
  S('°', 'Градус', 'Degree', 'special', ['градус', 'degree', 'температура']),
  S('µ', 'Микро', 'Micro sign', 'special', ['микро', 'micro', 'мю']),
  S('•', 'Буллит', 'Bullet', 'bullets', ['буллит', 'маркер', 'bullet', 'список']),
  S('…', 'Многоточие', 'Ellipsis', 'special', ['многоточие', 'ellipsis', 'троеточие']),
  S('⁂', 'Астеризм', 'Asterism', 'special', ['астеризм', 'asterism']),
  S('※', 'Знак ссылки', 'Reference mark', 'special', ['ссылка', 'reference', 'примечание']),

  // Arrows
  S('→', 'Стрелка вправо', 'Right arrow', 'arrows', ['стрелка', 'arrow', 'вправо', 'right']),
  S('←', 'Стрелка влево', 'Left arrow', 'arrows', ['стрелка', 'arrow', 'влево', 'left']),
  S('↑', 'Стрелка вверх', 'Up arrow', 'arrows', ['стрелка', 'arrow', 'вверх', 'up']),
  S('↓', 'Стрелка вниз', 'Down arrow', 'arrows', ['стрелка', 'arrow', 'вниз', 'down']),
  S('↔', 'Стрелка влево-вправо', 'Left-right arrow', 'arrows', ['стрелка', 'arrow']),
  S('↕', 'Стрелка вверх-вниз', 'Up-down arrow', 'arrows', ['стрелка', 'arrow']),
  S('⇒', 'Двойная стрелка вправо', 'Double right arrow', 'arrows', ['стрелка', 'arrow', 'следствие']),
  S('⇐', 'Двойная стрелка влево', 'Double left arrow', 'arrows', ['стрелка', 'arrow']),
  S('⇔', 'Двойная стрелка влево-вправо', 'Double left-right arrow', 'arrows', ['стрелка', 'arrow', 'эквивалентно']),
  S('➜', 'Жирная стрелка', 'Heavy arrow', 'arrows', ['стрелка', 'arrow']),
  S('➤', 'Стрелка-указатель', 'Pointer arrow', 'arrows', ['стрелка', 'arrow', 'указатель']),

  // Fractions
  S('½', 'Одна вторая', 'One half', 'fractions', ['дробь', 'половина', 'fraction', 'half']),
  S('⅓', 'Одна треть', 'One third', 'fractions', ['дробь', 'треть', 'fraction']),
  S('¼', 'Одна четверть', 'One quarter', 'fractions', ['дробь', 'четверть', 'fraction']),
  S('¾', 'Три четверти', 'Three quarters', 'fractions', ['дробь', 'fraction']),
  S('⅔', 'Две трети', 'Two thirds', 'fractions', ['дробь', 'fraction']),
  S('⅛', 'Одна восьмая', 'One eighth', 'fractions', ['дробь', 'fraction']),
  S('⅜', 'Три восьмых', 'Three eighths', 'fractions', ['дробь', 'fraction']),
  S('⅝', 'Пять восьмых', 'Five eighths', 'fractions', ['дробь', 'fraction']),
  S('⅞', 'Семь восьмых', 'Seven eighths', 'fractions', ['дробь', 'fraction']),

  // Other
  S('✓', 'Галочка', 'Check mark', 'checks', ['галочка', 'check', 'чек']),
  S('✔', 'Жирная галочка', 'Heavy check mark', 'checks', ['галочка', 'check']),
  S('✕', 'Крестик', 'Cross', 'checks', ['крестик', 'cross', 'x']),
  S('✖', 'Жирный крестик', 'Heavy cross', 'checks', ['крестик', 'cross']),
  S('⚠', 'Предупреждение', 'Warning', 'other', ['предупреждение', 'warning', 'внимание']),
  S('★', 'Звезда закрашенная', 'Filled star', 'stars', ['звезда', 'star']),
  S('☆', 'Звезда контурная', 'Outlined star', 'stars', ['звезда', 'star']),
  S('♥', 'Сердце закрашенное', 'Filled heart', 'other', ['сердце', 'heart']),
  S('♡', 'Сердце контурное', 'Outlined heart', 'other', ['сердце', 'heart']),
  S('☑', 'Чекбокс с галочкой', 'Checked checkbox', 'checks', ['чекбокс', 'checkbox']),
  S('☐', 'Пустой чекбокс', 'Empty checkbox', 'checks', ['чекбокс', 'checkbox']),
  S('☒', 'Чекбокс с крестиком', 'Crossed checkbox', 'checks', ['чекбокс', 'checkbox']),

  // Currency — extended set
  S('₼', 'Азербайджанский манат', 'Azerbaijani manat', 'currency', ['валюта', 'манат', 'manat']),
  S('₾', 'Грузинский лари', 'Georgian lari', 'currency', ['валюта', 'лари', 'lari']),
  S('฿', 'Тайский бат', 'Thai baht', 'currency', ['валюта', 'бат', 'baht']),
  S('₫', 'Вьетнамский донг', 'Vietnamese dong', 'currency', ['валюта', 'донг', 'dong']),
  S('₱', 'Филиппинское песо', 'Philippine peso', 'currency', ['валюта', 'песо', 'peso']),
  S('¢', 'Цент', 'Cent', 'currency', ['валюта', 'цент', 'cent']),
  S('ƒ', 'Флорин', 'Florin', 'currency', ['валюта', 'флорин', 'florin']),
  S('¤', 'Знак валюты', 'Currency sign', 'currency', ['валюта', 'currency']),

  // Special — sound recording copyright
  S('℗', 'Знак звукозаписи', 'Sound recording copyright', 'special', ['звукозапись', 'phonogram', '(p)']),

  // Arrows — extended set
  S('⇑', 'Двойная стрелка вверх', 'Double up arrow', 'arrows', ['стрелка', 'вверх', 'double']),
  S('⇓', 'Двойная стрелка вниз', 'Double down arrow', 'arrows', ['стрелка', 'вниз', 'double']),
  S('↖', 'Стрелка влево-вверх', 'Up-left arrow', 'arrows', ['стрелка', 'диагональ']),
  S('↗', 'Стрелка вправо-вверх', 'Up-right arrow', 'arrows', ['стрелка', 'диагональ', 'рост']),
  S('↘', 'Стрелка вправо-вниз', 'Down-right arrow', 'arrows', ['стрелка', 'диагональ']),
  S('↙', 'Стрелка влево-вниз', 'Down-left arrow', 'arrows', ['стрелка', 'диагональ']),
  S('⟶', 'Длинная стрелка вправо', 'Long right arrow', 'arrows', ['стрелка', 'длинная']),
  S('⟵', 'Длинная стрелка влево', 'Long left arrow', 'arrows', ['стрелка', 'длинная']),
  S('⟷', 'Длинная стрелка влево-вправо', 'Long left-right arrow', 'arrows', ['стрелка', 'длинная']),
  S('↺', 'Против часовой стрелки', 'Anticlockwise arrow', 'arrows', ['стрелка', 'круг', 'обновить']),
  S('↻', 'По часовой стрелке', 'Clockwise arrow', 'arrows', ['стрелка', 'круг', 'обновить']),
  S('↩', 'Стрелка возврата влево', 'Return arrow left', 'arrows', ['стрелка', 'возврат', 'return']),
  S('↪', 'Стрелка возврата вправо', 'Return arrow right', 'arrows', ['стрелка', 'возврат']),

  // Checks & crosses
  S('✗', 'Крестик', 'Ballot X', 'checks', ['крестик', 'cross', 'нет']),
  S('✘', 'Жирный крестик', 'Heavy ballot X', 'checks', ['крестик', 'cross', 'жирный']),

  // Stars
  S('✦', 'Четырёхконечная звезда', 'Four-pointed star', 'stars', ['звезда', 'блеск']),
  S('✧', 'Белая четырёхконечная звезда', 'White four-pointed star', 'stars', ['звезда', 'блеск']),
  S('✩', 'Контурная звезда', 'Stress outlined star', 'stars', ['звезда', 'контур']),
  S('✪', 'Звезда в круге', 'Circled star', 'stars', ['звезда', 'круг']),
  S('✭', 'Звезда с контуром', 'Outlined black star', 'stars', ['звезда']),
  S('✮', 'Жирная контурная звезда', 'Heavy outlined star', 'stars', ['звезда']),

  // List bullets
  S('◦', 'Белый маркер', 'White bullet', 'bullets', ['маркер', 'список']),
  S('‣', 'Треугольный маркер', 'Triangular bullet', 'bullets', ['маркер', 'список']),
  S('▪', 'Малый чёрный квадрат', 'Black small square', 'bullets', ['маркер', 'квадрат']),
  S('▫', 'Малый белый квадрат', 'White small square', 'bullets', ['маркер', 'квадрат']),
  S('●', 'Чёрный круг', 'Black circle', 'bullets', ['маркер', 'круг']),
  S('○', 'Белый круг', 'White circle', 'bullets', ['маркер', 'круг']),
  S('◉', 'Круг с точкой', 'Fisheye', 'bullets', ['маркер', 'круг', 'радио']),
  S('▸', 'Малый треугольник вправо', 'Small right triangle', 'bullets', ['маркер', 'треугольник']),
  S('◆', 'Чёрный ромб', 'Black diamond', 'bullets', ['маркер', 'ромб']),
  S('◇', 'Белый ромб', 'White diamond', 'bullets', ['маркер', 'ромб']),
  S('❖', 'Ромб с узором', 'Diamond minus white X', 'bullets', ['маркер', 'ромб']),

  // Math — extended
  S('≪', 'Гораздо меньше', 'Much less than', 'math', ['меньше', 'much less']),
  S('≫', 'Гораздо больше', 'Much greater than', 'math', ['больше', 'much greater']),
  S('⋅', 'Точка умножения', 'Dot operator', 'math', ['умножение', 'точка', 'dot']),

  // Fractions — extended
  S('⅕', 'Одна пятая', 'One fifth', 'fractions', ['дробь', 'пятая']),
  S('⅖', 'Две пятых', 'Two fifths', 'fractions', ['дробь', 'пятых']),
  S('⅗', 'Три пятых', 'Three fifths', 'fractions', ['дробь', 'пятых']),
  S('⅘', 'Четыре пятых', 'Four fifths', 'fractions', ['дробь', 'пятых']),
  S('⅙', 'Одна шестая', 'One sixth', 'fractions', ['дробь', 'шестая']),
  S('⅚', 'Пять шестых', 'Five sixths', 'fractions', ['дробь', 'шестых']),

  // Keyboard (Mac)
  S('⌘', 'Command (Mac)', 'Command key', 'keyboard', ['клавиша', 'command', 'cmd', 'mac']),
  S('⌥', 'Option (Mac)', 'Option key', 'keyboard', ['клавиша', 'option', 'alt', 'mac']),
  S('⌃', 'Control', 'Control key', 'keyboard', ['клавиша', 'control', 'ctrl']),
  S('⇧', 'Shift', 'Shift key', 'keyboard', ['клавиша', 'shift']),
  S('⎋', 'Escape', 'Escape key', 'keyboard', ['клавиша', 'escape', 'esc']),
  S('⏎', 'Return', 'Return key', 'keyboard', ['клавиша', 'return', 'enter', 'ввод']),
  S('⌫', 'Backspace', 'Backspace key', 'keyboard', ['клавиша', 'backspace', 'удалить']),
  S('⌦', 'Delete', 'Forward delete key', 'keyboard', ['клавиша', 'delete']),
  S('⇥', 'Tab', 'Tab key', 'keyboard', ['клавиша', 'tab', 'табуляция']),
  S('⇪', 'Caps Lock', 'Caps Lock key', 'keyboard', ['клавиша', 'caps lock', 'капс']),
];

/** Search across names (both languages), keywords, category and the symbol
 *  itself. Extensible: new symbols only need a data entry above. */
export function searchSymbols(query: string, list: TypografSymbol[] = SYMBOLS): TypografSymbol[] {
  const q = query.trim().toLowerCase();
  if (q === '') return list;
  return list.filter(
    (s) =>
      s.char === query ||
      s.nameRu.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.category.includes(q) ||
      s.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}
