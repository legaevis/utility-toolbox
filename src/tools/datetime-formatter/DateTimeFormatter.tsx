import { useMemo, useState } from 'react';
import { formatDateTime, REGIONS, resolveLocale } from '../../localization/localeService';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Shows one moment in every regional format — pick, compare, copy. */
export function DateTimeFormatter() {
  const { t } = useI18n();
  const now = new Date();
  const [date, setDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  const [time, setTime] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);

  const ts = useMemo(() => {
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null;
    return new Date(y, mo - 1, d, h, mi).getTime();
  }, [date, time]);

  const rows =
    ts === null
      ? []
      : REGIONS.filter((r) => r.id !== 'auto' && r.id !== 'custom').map((r) => {
          const locale = resolveLocale(r.id, '');
          return { id: r.id, formatted: formatDateTime(ts, locale) };
        });

  return (
    <div className="generic-tool">
      <div className="converter-row">
        <label className="option option-text">
          <span>{t('tools.timezone-converter.labels.date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="option option-text">
          <span>{t('tools.timezone-converter.labels.time')}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <div className="field-header">
        <label>{t('common.output')}</label>
      </div>
      <div className="report-view">
        {rows.length === 0 && <span className="empty-hint">{t('common.emptyOutput')}</span>}
        {rows.map((r) => (
          <div className="clock-row" key={r.id}>
            <span className="clock-city">
              <span className="clock-name">{t(`settings.regions.${r.id}`)}</span>
            </span>
            <span className="converter-main">{r.formatted}</span>
            <span className="clock-actions">
              <CopyButton text={r.formatted} icon />
            </span>
          </div>
        ))}
      </div>

      {/* Standard contextual footer (39-1010): Clear resets to "now",
          Copy takes the whole list. */}
      <div className="tool-footer">
        <div>
          <button
            className="btn btn-cta btn-secondary"
            onClick={() => {
              const n = new Date();
              setDate(`${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`);
              setTime(`${pad(n.getHours())}:${pad(n.getMinutes())}`);
            }}
          >
            {t('common.clear')}
          </button>
        </div>
        <div className="tool-footer-right">
          <CopyButton
            text={rows.map((r) => `${t(`settings.regions.${r.id}`)}: ${r.formatted}`).join('\n')}
            large
          />
        </div>
      </div>
    </div>
  );
}
