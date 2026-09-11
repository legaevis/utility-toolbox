import { useMemo, useState } from 'react';
import { countMatches, findReplace } from '../../processors/findReplace';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';

export function FindReplace() {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [find, setFind] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [output, setOutput] = useState('');
  const [replacedCount, setReplacedCount] = useState<number | null>(null);
  // Footer CTA swaps «Заменить всё» ↔ «Копировать» (39-1010 pattern).
  const [dirty, setDirty] = useState(true);

  const matches = useMemo(
    () => countMatches(input, find, caseSensitive, wholeWord),
    [input, find, caseSensitive, wholeWord],
  );

  const run = (replaceAll: boolean) => {
    const result = findReplace(input, { find, replaceWith, caseSensitive, wholeWord, replaceAll });
    setOutput(result.output);
    setReplacedCount(result.replaced);
    setDirty(false);
  };

  return (
    <div className="generic-tool">
      <div className="field-header">
        <label>{t('common.input')}</label>
      </div>
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

      <div className="two-col">
        <label className="option option-text">
          <span>{t('tools.find-replace.labels.find')}</span>
          <input
            type="text"
            value={find}
            onChange={(e) => {
              setFind(e.target.value);
              setDirty(true);
            }}
            spellCheck={false}
          />
        </label>
        <label className="option option-text">
          <span>{t('tools.find-replace.labels.replace')}</span>
          <input
            type="text"
            value={replaceWith}
            onChange={(e) => {
              setReplaceWith(e.target.value);
              setDirty(true);
            }}
            spellCheck={false}
          />
        </label>
      </div>

      <div className="options-panel">
        <div className="options-grid">
          <label className="option option-toggle">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
            <span>{t('tools.find-replace.options.caseSensitive')}</span>
          </label>
          <label className="option option-toggle">
            <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
            <span>{t('tools.find-replace.options.wholeWord')}</span>
          </label>
        </div>
      </div>

      <div className="mode-row">
        <button className="btn" onClick={() => run(false)} disabled={find === ''}>
          {t('tools.find-replace.labels.replaceFirstBtn')}
        </button>
        <span className="meta-line">
          {t('tools.find-replace.labels.matches', { n: matches })}
          {replacedCount !== null && ' · ' + t('tools.find-replace.labels.replacedAll', { n: replacedCount })}
        </span>
      </div>

      <div className="field-header">
        <label>{t('common.output')}</label>
      </div>
      <textarea className="text-area output" value={output} readOnly spellCheck={false} placeholder={t('common.emptyOutput')} />

      {/* Contextual footer: «Заменить всё» until the result is fresh, then Copy. */}
      <div className="tool-footer">
        <div>
          <button
            className="btn btn-cta btn-secondary"
            onClick={() => {
              setInput('');
              setOutput('');
              setReplacedCount(null);
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
              setOutput('');
              setReplacedCount(null);
              setDirty(true);
            }}
            disabled={output === ''}
          >
            {t('common.replaceInput')}
          </button>
          {dirty || output === '' ? (
            <button
              className="btn btn-cta btn-primary"
              onClick={() => run(true)}
              disabled={find === ''}
            >
              {t('tools.find-replace.labels.replaceAllBtn')}
            </button>
          ) : (
            <CopyButton text={output} large />
          )}
        </div>
      </div>
    </div>
  );
}
