import { useEffect, useState } from 'react';
import { allTimeZones, timeZoneCity, timeZoneOffsetLabel } from '../../localization/localeService';
import { useLocale } from '../../localization/LocaleContext';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';
import { loadCities, saveCities } from '../../storage/worldClock';

/** Live multi-timezone clock. Fully offline: timezone data comes from the
 *  platform (Intl); the ticking clock is just the local system time. */
export function WorldClock() {
  const { t } = useI18n();
  const { locale, formatTime, formatDate } = useLocale();
  const [cities, setCities] = useState<string[]>(() => loadCities());
  const [newCity, setNewCity] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // Auto-refresh, aligned to the start of each minute (plus a first tick every second until aligned).
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const zones = allTimeZones();

  const addCity = () => {
    const tz = newCity.trim();
    if (!zones.includes(tz) || cities.includes(tz)) return;
    const next = [...cities, tz];
    setCities(next);
    saveCities(next);
    setNewCity('');
  };

  const removeCity = (tz: string) => {
    const next = cities.filter((c) => c !== tz);
    setCities(next);
    saveCities(next);
  };

  return (
    <div className="generic-tool">
      <div className="clock-add">
        <input
          className="search-input"
          list="tz-list"
          value={newCity}
          placeholder={t('tools.world-clock.labels.addPlaceholder')}
          onChange={(e) => setNewCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCity()}
          spellCheck={false}
        />
        <datalist id="tz-list">
          {zones.map((z) => (
            <option key={z} value={z}>
              {timeZoneCity(z)}
            </option>
          ))}
        </datalist>
        <button className="btn btn-primary" onClick={addCity} disabled={!zones.includes(newCity.trim())}>
          {t('tools.world-clock.labels.add')}
        </button>
      </div>

      <div className="clock-list">
        {cities.map((tz) => {
          const copyText = `${formatDate(now, tz)}, ${formatTime(now, tz)}`;
          return (
            <div className="clock-row" key={tz}>
              <div className="clock-city">
                <span className="clock-name">{timeZoneCity(tz)}</span>
                <span className="clock-offset">{timeZoneOffsetLabel(tz, now, locale)}</span>
              </div>
              <div className="clock-time">
                <span className="clock-hm">{formatTime(now, tz)}</span>
                <span className="clock-date">{formatDate(now, tz)}</span>
              </div>
              <div className="clock-actions">
                <CopyButton text={copyText} icon />
                <button className="btn btn-ghost" onClick={() => removeCity(tz)}>
                  {t('tools.world-clock.labels.remove')}
                </button>
              </div>
            </div>
          );
        })}
        {cities.length === 0 && <p className="empty-hint">{t('tools.world-clock.labels.empty')}</p>}
      </div>
    </div>
  );
}
