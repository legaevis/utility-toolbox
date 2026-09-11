import { useMemo, useState } from 'react';
import {
  UNIT_CATEGORIES,
  convertUnit,
  getCategory,
  metersToFeetInches,
  type UnitCategoryId,
} from '../../processors/unitConverter';
import { formatNumber, resolveLocale, REGIONS, type RegionId } from '../../localization/localeService';
import { useLocale } from '../../localization/LocaleContext';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';

export function UnitConverter() {
  const { t } = useI18n();
  const globalLocale = useLocale();

  const [category, setCategory] = useState<UnitCategoryId>('length');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');
  const [rawValue, setRawValue] = useState('1');
  // Local region override; 'global' follows Settings → Region & Format.
  const [regionOverride, setRegionOverride] = useState<'global' | RegionId>('global');

  const locale =
    regionOverride === 'global' ? globalLocale.locale : resolveLocale(regionOverride, '');

  const cat = getCategory(category);

  const changeCategory = (id: UnitCategoryId) => {
    setCategory(id);
    const units = getCategory(id).units;
    setFrom(units[0].id);
    setTo(units[1] ? units[1].id : units[0].id);
  };

  // The exact value is computed once; formatting is presentation-only.
  const value = parseFloat(rawValue.replace(',', '.'));
  const result = useMemo(
    () => convertUnit(value, category, from, to),
    [value, category, from, to],
  );

  const unitLabel = (id: string) => t(`tools.unit-converter.units.${id}`);

  const formatted = Number.isFinite(result) ? formatNumber(result, locale) : '';
  const resultLine = formatted === '' ? '' : `${formatted} ${unitLabel(to)}`;

  // US-style composite display for lengths converted to feet: 5 ft 8 in.
  const composite =
    Number.isFinite(result) && category === 'length' && to === 'ft'
      ? metersToFeetInches(convertUnit(value, 'length', from, 'm'))
      : null;
  const compositeLine = composite ? `${composite.feet} ft ${formatNumber(composite.inches, locale)} in` : '';

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="generic-tool">
      <div className="mode-row">
        {UNIT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={category === c.id ? 'btn btn-mode active' : 'btn btn-mode'}
            onClick={() => changeCategory(c.id)}
          >
            {t(`tools.unit-converter.categories.${c.id}`)}
          </button>
        ))}
      </div>

      <div className="converter-row">
        <label className="option option-text">
          <span>{t('tools.unit-converter.labels.value')}</span>
          <input
            type="text"
            inputMode="decimal"
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            spellCheck={false}
          />
        </label>
        <label className="option option-text">
          <span>{t('tools.unit-converter.labels.from')}</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {unitLabel(u.id)}
              </option>
            ))}
          </select>
        </label>
        <button className="btn swap-btn" onClick={swap} title={t('common.swap')}>
          {t('common.swap')}
        </button>
        <label className="option option-text">
          <span>{t('tools.unit-converter.labels.to')}</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {unitLabel(u.id)}
              </option>
            ))}
          </select>
        </label>
        <label className="option option-text">
          <span>{t('settings.region')}</span>
          <select
            value={regionOverride}
            onChange={(e) => setRegionOverride(e.target.value as 'global' | RegionId)}
          >
            <option value="global">{t('tools.unit-converter.labels.globalRegion')}</option>
            {REGIONS.filter((r) => r.id !== 'custom' && r.id !== 'auto').map((r) => (
              <option key={r.id} value={r.id}>
                {t(`settings.regions.${r.id}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-header">
        <label>{t('common.output')}</label>
      </div>
      <div className="report-view converter-result">
        {resultLine === '' ? (
          <span className="empty-hint">{t('tools.unit-converter.labels.enterNumber')}</span>
        ) : (
          <>
            <span className="converter-main">{resultLine}</span>
            {compositeLine && <span className="converter-composite">{compositeLine}</span>}
          </>
        )}
      </div>
      <div className="action-row">
        <CopyButton text={compositeLine ? `${resultLine} (${compositeLine})` : resultLine} icon />
      </div>
    </div>
  );
}
