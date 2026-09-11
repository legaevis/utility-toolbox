import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { typografDetailed, type RuleCategory } from '../../processors/typograf/engine';
import {
  SYMBOLS,
  SYMBOL_CATEGORIES,
  searchSymbols,
  type TypografSymbol,
} from '../../processors/typograf/symbols';
import {
  DEFAULT_TYPOGRAF_SETTINGS,
  loadSymbolFavorites,
  loadTypografSettings,
  saveTypografSettings,
  toggleSymbolFavorite,
  type TypografToolSettings,
} from '../../storage/typograf';
import { countText } from '../../processors/counter';
import { diffChanges, type ChangePair } from '../../processors/typograf/diff';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';
import { IconHelp, IconStar } from '../../components/icons';

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

// ---------------------------------------------------------------------------
// Symbols panel
// ---------------------------------------------------------------------------

function SymbolTile({
  symbol,
  name,
  isFavorite,
  onCopy,
  onToggleFavorite,
}: {
  symbol: TypografSymbol;
  name: string;
  isFavorite: boolean;
  onCopy: (s: TypografSymbol) => void;
  onToggleFavorite: (char: string) => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="symbol-tile">
      <button
        className={copied ? 'symbol-btn copied' : 'symbol-btn'}
        title={name}
        onClick={() => {
          onCopy(symbol);
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1200);
        }}
      >
        {/* The «Copied» badge OVERLAYS the glyph — the tile never changes
            size, so the grid doesn't shift while copying. */}
        <span className="symbol-char">{symbol.display ?? symbol.char}</span>
        <span className="symbol-copied" aria-hidden={!copied}>
          {t('common.copied')}
        </span>
        <span className="symbol-name">{name}</span>
      </button>
      <button
        className={isFavorite ? 'symbol-star active' : 'symbol-star'}
        title={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
        onClick={() => onToggleFavorite(symbol.char)}
      >
        <IconStar filled={isFavorite} />
      </button>
    </div>
  );
}

function SymbolsPanel() {
  const { t, language } = useI18n();
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => loadSymbolFavorites());

  const nameOf = (s: TypografSymbol) => (language === 'ru' ? s.nameRu : s.nameEn);
  const byChar = useMemo(() => new Map(SYMBOLS.map((s) => [s.char, s])), []);

  const copy = (s: TypografSymbol) => {
    void copyToClipboard(s.char);
  };
  const toggleFav = (char: string) => setFavorites(toggleSymbolFavorite(char));

  const searching = query.trim() !== '';
  const results = useMemo(() => searchSymbols(query), [query]);

  const renderGrid = (list: TypografSymbol[]) => (
    <div className="symbol-grid">
      {list.map((s) => (
        <SymbolTile
          key={s.char}
          symbol={s}
          name={nameOf(s)}
          isFavorite={favorites.includes(s.char)}
          onCopy={copy}
          onToggleFavorite={toggleFav}
        />
      ))}
    </div>
  );

  const favoriteSymbols = favorites
    .map((c) => byChar.get(c))
    .filter((x): x is TypografSymbol => !!x);

  return (
    <div className="symbols-panel">
      <div className="search-bar">
        <input
          type="search"
          value={query}
          placeholder={t('tools.typography.labels.symbolSearch')}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
      </div>

      {searching ? (
        results.length === 0 ? (
          <p className="empty-hint">{t('nav.noResults')}</p>
        ) : (
          renderGrid(results)
        )
      ) : (
        <>
          {favoriteSymbols.length > 0 && (
            <>
              <h4 className="symbol-cat-title">{t('tools.typography.labels.favorites')}</h4>
              {renderGrid(favoriteSymbols)}
            </>
          )}
          {SYMBOL_CATEGORIES.map((cat) => (
            <div key={cat}>
              <h4 className="symbol-cat-title">{t(`tools.typography.symbolCats.${cat}`)}</h4>
              {renderGrid(SYMBOLS.filter((s) => s.category === cat))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text panel
// ---------------------------------------------------------------------------

function RuleSwitch({
  checked,
  label,
  hint,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="option option-toggle rule-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
      {/* Custom CSS tooltip (data-tip) — instant on hover, unlike title. */}
      <span className="rule-hint" data-tip={hint} onClick={(e) => e.preventDefault()}>
        <IconHelp />
      </span>
    </label>
  );
}

/** Settings sections (per the competitor reference): related rule
 *  categories are grouped under small headings. Every RULE_CATEGORY must
 *  appear in exactly one group. */
const RULE_GROUPS: { id: string; cats: RuleCategory[] }[] = [
  { id: 'spacing', cats: ['spaces', 'nbsp', 'hanging'] },
  { id: 'punct', cats: ['punctuation', 'quotes', 'dashes'] },
  { id: 'numbers', cats: ['numbers', 'math', 'specials', 'numero'] },
  { id: 'datetime', cats: ['dates', 'time'] },
  { id: 'money', cats: ['currency', 'units'] },
  { id: 'other', cats: ['phones', 'abbrev', 'yo'] },
];

function TextPanel() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<TypografToolSettings>(() => loadTypografSettings());
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  // Footer CTA swaps «Типографировать» ↔ «Копировать» (39-1010 mockup).
  const [dirty, setDirty] = useState(true);
  // §35 «Показать изменения»: which rule categories fired on the last run.
  const [fired, setFired] = useState<Partial<Record<RuleCategory, number>> | null>(null);
  // §25: concrete «было → стало» pairs of the last run.
  const [changes, setChanges] = useState<ChangePair[] | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  // Portal target inside the ToolShell toolbar (39-108: live switch there).
  const [toolbarSlot, setToolbarSlot] = useState<Element | null>(null);
  useEffect(() => {
    setToolbarSlot(document.querySelector('.tool-toolbar .toolbar-slot'));
  }, []);

  const update = (next: TypografToolSettings) => {
    setSettings(next);
    saveTypografSettings(next);
    setDirty(true);
  };

  const run = (text = input, s = settings) => {
    setDirty(false);
    try {
      const res = typografDetailed(text, {
        language: s.language,
        categories: s.categories,
        fixLayout: s.fixLayout,
        aggressive: s.aggressive,
      });
      setOutput(res.text);
      setFired(text.trim() === '' ? null : res.fired);
      setChanges(text.trim() === '' || res.text === text ? null : diffChanges(text, res.text));
    } catch {
      setOutput('');
      setFired(null);
      setChanges(null);
    }
  };

  // Live processing (existing app pattern), debounced.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!settings.live) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => run(), 200);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, settings]);

  const stats = useMemo(() => countText(input), [input]);

  return (
    <>
      {/* «Живая обработка» lives in the ToolShell toolbar (39-108) —
          rendered there through the .toolbar-slot portal. */}
      {toolbarSlot &&
        createPortal(
          <label className="option option-toggle toolbar-live">
            <span>{t('tools.typography.labels.live')}</span>
            <input
              type="checkbox"
              checked={settings.live}
              onChange={(e) => update({ ...settings, live: e.target.checked })}
            />
          </label>,
          toolbarSlot,
        )}

      <div className="io-grid">
        <div className="field-wrap">
          <textarea
            className="text-area"
            value={input}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => {
              setInput(e.target.value);
              setDirty(true);
            }}
            spellCheck={false}
          />
          <div className="field-copy">
            <CopyButton text={input} icon />
          </div>
        </div>
        <div className="field-wrap">
          <textarea
            className="text-area output"
            value={output}
            placeholder={t('common.emptyOutput')}
            readOnly
            spellCheck={false}
          />
          <div className="field-copy">
            <CopyButton text={output} icon />
          </div>
        </div>
      </div>
      <div className="meta-line">
        {t('tools.character-counter.labels.characters')}: {stats.characters.toLocaleString()} ·{' '}
        {t('tools.character-counter.labels.words')}: {stats.words.toLocaleString()}
        {fired && Object.keys(fired).length > 0 && (
          <>
            {' · '}
            {t('tools.typography.labels.statsFired')}:{' '}
            {Object.entries(fired)
              .map(([cat, n]) => `${t(`tools.typography.ruleCats.${cat}`).toLowerCase()} (${n})`)
              .join(', ')}
          </>
        )}
        {changes && changes.length > 0 && (
          <>
            {' · '}
            <button className="btn-link" onClick={() => setShowChanges(!showChanges)}>
              {showChanges
                ? t('tools.typography.labels.hideChanges')
                : `${t('tools.typography.labels.showChanges')} (${changes.length})`}
            </button>
          </>
        )}
      </div>

      {/* §25 «Показать изменения»: exact «было → стало» pairs. */}
      {showChanges && changes && changes.length > 0 && (
        <div className="changes-list">
          {changes.map((c, i) => (
            <div className="change-row" key={i}>
              <span className="change-from">{c.from || '∅'}</span>
              <span className="change-arrow">→</span>
              <span className="change-to">{c.to || '∅'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Settings card — always visible (39-108), every rule with a "?" hint. */}
      <div className="options-card">
        <div className="options-panel">
          <div className="options-title">{t('common.options')}</div>
          {/* Language row: «Сбросить правила» sits opposite the language
              select, visually separated from the rule sections below. */}
          <div className="typograf-lang-row">
            <label className="option option-select">
              <span>{t('tools.typography.labels.language')}</span>
              <select
                value={settings.language}
                onChange={(e) =>
                  update({ ...settings, language: e.target.value as 'auto' | 'ru' | 'en' })
                }
              >
                <option value="auto">{t('tools.typography.labels.langAuto')}</option>
                <option value="ru">{t('tools.typography.labels.langRu')}</option>
                <option value="en">{t('tools.typography.labels.langEn')}</option>
              </select>
            </label>
            <button
              className="btn btn-ghost"
              onClick={() =>
                update({
                  ...DEFAULT_TYPOGRAF_SETTINGS,
                  live: settings.live,
                  language: settings.language,
                })
              }
            >
              {t('tools.typography.labels.resetRules')}
            </button>
          </div>

          {/* Rule sections, grouped like the competitor reference. */}
          {RULE_GROUPS.map((group) => (
            <div className="rule-group" key={group.id}>
              <div className="rule-group-title">
                {t(`tools.typography.ruleGroups.${group.id}`)}
              </div>
              <div className="options-grid">
                {group.cats.map((cat) => (
                  <RuleSwitch
                    key={cat}
                    checked={settings.categories[cat]}
                    label={t(`tools.typography.ruleCats.${cat}`)}
                    hint={t(`tools.typography.ruleHints.${cat}`)}
                    onChange={(v) =>
                      update({ ...settings, categories: { ...settings.categories, [cat]: v } })
                    }
                  />
                ))}
                {group.id === 'other' && (
                  <>
                    <RuleSwitch
                      checked={settings.fixLayout}
                      label={t('tools.typography.ruleCats.layout')}
                      hint={t('tools.typography.ruleHints.layout')}
                      onChange={(v) => update({ ...settings, fixLayout: v })}
                    />
                    <RuleSwitch
                      checked={settings.aggressive}
                      label={t('tools.typography.labels.aggressive')}
                      hint={t('tools.typography.ruleHints.aggressive')}
                      onChange={(v) => update({ ...settings, aggressive: v })}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contextual footer: Типографировать until the result is fresh, then
          Копировать (live mode is always fresh → always Copy). */}
      <div className="tool-footer">
        <div>
          <button
            className="btn btn-cta btn-secondary"
            onClick={() => {
              setInput('');
              setOutput('');
              setFired(null);
              setDirty(true);
            }}
            disabled={input === ''}
          >
            {t('common.clear')}
          </button>
        </div>
        <div className="tool-footer-right">
          <button
            className="btn btn-cta btn-secondary"
            onClick={() => {
              setInput(output);
              setDirty(true);
            }}
            disabled={output === ''}
          >
            {t('common.replaceInput')}
          </button>
          {!settings.live && (dirty || output === '') ? (
            <button
              className="btn btn-cta btn-primary"
              onClick={() => run()}
              disabled={input === ''}
            >
              {t('tools.typography.labels.typografy')}
            </button>
          ) : (
            <CopyButton text={output} large />
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// The tool. The Text/Symbols split lives in the middle column (the pinned
// section's sub-navigation, rendered by App) — `view` selects the panel.
// ---------------------------------------------------------------------------

export function Typograf({ view = 'text' }: { view?: 'text' | 'symbols' }) {
  return (
    <div className="generic-tool">
      {view === 'text' ? <TextPanel /> : <SymbolsPanel />}
    </div>
  );
}
