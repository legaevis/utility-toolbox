import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../localization/i18n';
import { IconCheckSmall, IconCopy } from './icons';

/**
 * Copy button. When `html` is provided it writes a rich clipboard item
 * (text/html + text/plain) so links stay clickable in rich-text apps,
 * falling back to plain text where the rich clipboard is unavailable.
 */
export function CopyButton({
  text,
  html,
  disabled,
  large,
  icon,
}: {
  text: string;
  html?: string;
  disabled?: boolean;
  /** Footer-size pill per the mockup (56px, wide padding). */
  large?: boolean;
  /** Icon-only variant: the word «Copy» is replaced by the copy glyph
   *  (used everywhere EXCEPT the footer action buttons). */
  icon?: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    let done = false;
    if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
        done = true;
      } catch {
        /* fall back to plain text below */
      }
    }
    if (!done) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Clipboard API unavailable — fall back to execCommand via a textarea.
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  if (icon) {
    return (
      <button
        className={copied ? 'btn-icon-copy is-copied' : 'btn-icon-copy'}
        onClick={copy}
        disabled={disabled || text === ''}
        title={copied ? t('common.copied') : t('common.copy')}
        aria-label={t('common.copy')}
      >
        {copied ? <IconCheckSmall /> : <IconCopy />}
      </button>
    );
  }

  return (
    <button
      className={large ? 'btn btn-primary btn-cta' : 'btn btn-primary'}
      onClick={copy}
      disabled={disabled || text === ''}
    >
      {copied ? t('common.copied') : t('common.copy')}
    </button>
  );
}
