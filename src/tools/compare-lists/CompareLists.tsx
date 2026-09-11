import { useMemo, useState } from 'react';
import { compareLists } from '../../processors/compareLists';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';

export function CompareLists() {
  const { t } = useI18n();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trim, setTrim] = useState(true);
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);

  const result = useMemo(
    () => compareLists(a, b, { caseSensitive, trim, ignoreEmptyLines: ignoreEmpty }),
    [a, b, caseSensitive, trim, ignoreEmpty],
  );

  const sections: { key: 'common' | 'onlyA' | 'onlyB' | 'unique'; items: string[] }[] = [
    { key: 'common', items: result.common },
    { key: 'onlyA', items: result.onlyA },
    { key: 'onlyB', items: result.onlyB },
    { key: 'unique', items: result.unique },
  ];

  return (
    <div className="generic-tool">
      <div className="two-col">
        <div>
          <div className="field-header">
            <label>{t('tools.compare-lists.labels.listA')}</label>
            <button className="btn btn-ghost" onClick={() => setA('')} disabled={a === ''}>
              {t('common.clear')}
            </button>
          </div>
          <textarea className="text-area" value={a} onChange={(e) => setA(e.target.value)} spellCheck={false} />
        </div>
        <div>
          <div className="field-header">
            <label>{t('tools.compare-lists.labels.listB')}</label>
            <button className="btn btn-ghost" onClick={() => setB('')} disabled={b === ''}>
              {t('common.clear')}
            </button>
          </div>
          <textarea className="text-area" value={b} onChange={(e) => setB(e.target.value)} spellCheck={false} />
        </div>
      </div>

      <div className="options-panel">
        <div className="options-grid">
          <label className="option option-toggle">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
            <span>{t('tools.compare-lists.options.caseSensitive')}</span>
          </label>
          <label className="option option-toggle">
            <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            <span>{t('tools.compare-lists.options.trim')}</span>
          </label>
          <label className="option option-toggle">
            <input type="checkbox" checked={ignoreEmpty} onChange={(e) => setIgnoreEmpty(e.target.checked)} />
            <span>{t('tools.compare-lists.options.ignoreEmptyLines')}</span>
          </label>
        </div>
      </div>

      <div className="compare-grid">
        {sections.map((s) => (
          <div className="compare-section" key={s.key}>
            <div className="field-header">
              <label>
                {t(`tools.compare-lists.labels.${s.key}`)} ({s.items.length})
              </label>
              <CopyButton text={s.items.join('\n')} icon />
            </div>
            <textarea className="text-area small" value={s.items.join('\n')} readOnly spellCheck={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
