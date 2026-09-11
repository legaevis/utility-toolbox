import { useMemo, useState } from 'react';
import { convertWallTime } from '../../processors/timezones';
import { allTimeZones, timeZoneCity } from '../../localization/localeService';
import { useLocale } from '../../localization/LocaleContext';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function todayValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowValue(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a specific wall-clock time between timezones. Offline (Intl). */
export function TimeZoneConverter() {
  const { t } = useI18n();
  const { formatTime, formatDate } = useLocale();

  const zones = allTimeZones();
  const [date, setDate] = useState(todayValue);
  const [time, setTime] = useState(nowValue);
  const [fromTz, setFromTz] = useState('Europe/Moscow');
  const [targets, setTargets] = useState<string[]>(['America/New_York']);
  const [newTarget, setNewTarget] = useState('');

  const epoch = useMemo(() => {
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null;
    try {
      return convertWallTime({ year: y, month: mo, day: d, hour: h, minute: mi }, fromTz);
    } catch {
      return null;
    }
  }, [date, time, fromTz]);

  const addTarget = () => {
    const tz = newTarget.trim();
    if (!zones.includes(tz) || targets.includes(tz)) return;
    setTargets([...targets, tz]);
    setNewTarget('');
  };

  const swap = () => {
    if (targets.length === 0) return;
    const [first, ...rest] = targets;
    setTargets([fromTz, ...rest]);
    setFromTz(first);
  };

  const resultLines = epoch === null ? [] : targets.map((tz) => ({
    tz,
    text: `${formatTime(epoch, tz)} — ${timeZoneCity(tz)} (${formatDate(epoch, tz)})`,
  }));

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
        <label className="option option-text">
          <span>{t('tools.timezone-converter.labels.from')}</span>
          <select value={fromTz} onChange={(e) => setFromTz(e.target.value)}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {timeZoneCity(z)}
              </option>
            ))}
          </select>
        </label>
        <button className="btn swap-btn" onClick={swap}>
          {t('common.swap')}
        </button>
      </div>

      <div className="clock-add">
        <input
          className="search-input"
          list="tz-list-conv"
          value={newTarget}
          placeholder={t('tools.timezone-converter.labels.addPlaceholder')}
          onChange={(e) => setNewTarget(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTarget()}
          spellCheck={false}
        />
        <datalist id="tz-list-conv">
          {zones.map((z) => (
            <option key={z} value={z}>
              {timeZoneCity(z)}
            </option>
          ))}
        </datalist>
        <button className="btn" onClick={addTarget} disabled={!zones.includes(newTarget.trim())}>
          {t('tools.timezone-converter.labels.addTarget')}
        </button>
      </div>

      <div className="field-header">
        <label>{t('common.output')}</label>
      </div>
      <div className="report-view">
        {resultLines.length === 0 && <span className="empty-hint">{t('common.emptyOutput')}</span>}
        {resultLines.map((r) => (
          <div className="clock-row" key={r.tz}>
            <span className="converter-main">{r.text}</span>
            <span className="clock-actions">
              <CopyButton text={r.text} icon />
              {targets.length > 1 && (
                <button className="btn btn-ghost" onClick={() => setTargets(targets.filter((x) => x !== r.tz))}>
                  {t('tools.world-clock.labels.remove')}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
