import { useMemo, useState } from 'react';
import { countText } from '../../processors/counter';
import { useI18n } from '../../localization/i18n';

export function CharacterCounter() {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const stats = useMemo(() => countText(input), [input]);

  const items: { key: string; value: number }[] = [
    { key: 'characters', value: stats.characters },
    { key: 'charactersWithoutSpaces', value: stats.charactersWithoutSpaces },
    { key: 'words', value: stats.words },
    { key: 'lines', value: stats.lines },
  ];

  return (
    <div className="generic-tool">
      <div className="stats-row">
        {items.map((item) => (
          <div className="stat-card" key={item.key}>
            <div className="stat-value">{item.value.toLocaleString()}</div>
            <div className="stat-label">{t(`tools.character-counter.labels.${item.key}`)}</div>
          </div>
        ))}
      </div>
      <div className="field-header">
        <label>{t('common.input')}</label>
      </div>
      <textarea
        className="text-area tall"
        value={input}
        placeholder={t('common.inputPlaceholder')}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
      />

      {/* Standard contextual footer (39-1010): only Clear makes sense here. */}
      <div className="tool-footer">
        <div>
          <button
            className="btn btn-cta btn-secondary"
            onClick={() => setInput('')}
            disabled={input === ''}
          >
            {t('common.clear')}
          </button>
        </div>
        <div className="tool-footer-right" />
      </div>
    </div>
  );
}
