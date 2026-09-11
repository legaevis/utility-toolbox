import { useState } from 'react';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';

/**
 * Offline spell checker (MVP).
 *
 * Uses the platform's native spell-check engine (macOS system spellchecker
 * in Electron; the browser's engine in dev): misspelled words are underlined
 * in the editing area below, and the context menu (right-click) offers
 * corrections. The text language is detected by the OS — independent of the
 * app UI language. No text is ever sent anywhere.
 *
 * A custom batch engine can be plugged in later via processors/spellcheck.
 */
export function SpellChecker() {
  const { t } = useI18n();
  const [text, setText] = useState('');

  return (
    <div className="generic-tool">
      <p className="settings-hint">{t('tools.spell-checker.labels.hint')}</p>
      <div className="field-header">
        <label>{t('common.input')}</label>
      </div>
      <textarea
        className="text-area tall"
        value={text}
        placeholder={t('tools.spell-checker.labels.placeholder')}
        onChange={(e) => setText(e.target.value)}
        spellCheck={true}
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* Standard contextual footer (39-1010): Clear | Copy. */}
      <div className="tool-footer">
        <div>
          <button
            className="btn btn-cta btn-secondary"
            onClick={() => setText('')}
            disabled={text === ''}
          >
            {t('common.clear')}
          </button>
        </div>
        <div className="tool-footer-right">
          <CopyButton text={text} large />
        </div>
      </div>
    </div>
  );
}
