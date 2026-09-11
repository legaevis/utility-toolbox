import type { OptionSpec, OptionValues } from '../types/tool';
import { useI18n } from '../localization/i18n';

export function optionDefaults(specs: OptionSpec[] | undefined): OptionValues {
  const out: OptionValues = {};
  for (const spec of specs ?? []) out[spec.id] = spec.default;
  return out;
}

export function OptionControl({
  toolId,
  spec,
  values,
  onChange,
}: {
  toolId: string;
  spec: OptionSpec;
  values: OptionValues;
  onChange: (values: OptionValues) => void;
}) {
  const { t } = useI18n();
  const label = t(`tools.${toolId}.options.${spec.labelKey}`);

  if (spec.kind === 'toggle') {
    return (
      <label className="option option-toggle">
        <input
          type="checkbox"
          checked={values[spec.id] === true}
          onChange={(e) => onChange({ ...values, [spec.id]: e.target.checked })}
        />
        <span>{label}</span>
      </label>
    );
  }

  if (spec.kind === 'select') {
    return (
      <label className="option option-select">
        <span>{label}</span>
        <select
          value={String(values[spec.id] ?? spec.default)}
          onChange={(e) => onChange({ ...values, [spec.id]: e.target.value })}
        >
          {spec.choices.map((c) => (
            <option key={c.value} value={c.value}>
              {t(`tools.${toolId}.options.${c.labelKey}`)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="option option-text">
      <span>{label}</span>
      <input
        type="text"
        value={String(values[spec.id] ?? spec.default)}
        placeholder={spec.placeholderKey ? t(`tools.${toolId}.options.${spec.placeholderKey}`) : undefined}
        onChange={(e) => onChange({ ...values, [spec.id]: e.target.value })}
      />
    </label>
  );
}

export function OptionsPanel({
  toolId,
  specs,
  values,
  onChange,
}: {
  toolId: string;
  specs: OptionSpec[];
  values: OptionValues;
  onChange: (values: OptionValues) => void;
}) {
  const { t } = useI18n();
  if (specs.length === 0) return null;
  return (
    <div className="options-panel">
      <div className="options-title">{t('common.options')}</div>
      <div className="options-grid">
        {specs.map((spec) => (
          <OptionControl key={spec.id} toolId={toolId} spec={spec} values={values} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}
