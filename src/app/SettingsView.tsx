import { useState } from 'react';
import { useI18n } from '../localization/i18n';
import type { AppSettings } from '../storage/settings';
import { clearCache, clearHistory, clearReports, resetApplication } from '../storage/storage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { REGIONS, type RegionId } from '../localization/localeService';
import type { AppTheme } from '../storage/settings';
import type { ToolCategory } from '../types/tool';

type PendingAction = 'cache' | 'history' | 'reports' | 'reset' | null;

export function SettingsView({
  settings,
  onSettingsChange,
  onDataCleared,
}: {
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onDataCleared: () => void;
}) {
  const { t, language, setLanguage } = useI18n();
  const [pending, setPending] = useState<PendingAction>(null);
  const [doneAction, setDoneAction] = useState<PendingAction>(null);

  const execute = (action: Exclude<PendingAction, null>) => {
    if (action === 'cache') clearCache();
    if (action === 'history') clearHistory();
    if (action === 'reports') clearReports();
    if (action === 'reset') {
      resetApplication();
      // Reset returns the app to its initial state, including language.
      setLanguage('en');
    }
    setPending(null);
    setDoneAction(action);
    window.setTimeout(() => setDoneAction(null), 2000);
    onDataCleared();
  };

  const confirmBody: Record<Exclude<PendingAction, null>, string> = {
    cache: t('settings.confirmClearCacheBody'),
    history: t('settings.confirmClearHistoryBody'),
    reports: t('settings.confirmClearReportsBody'),
    reset: t('settings.confirmResetBody'),
  };

  const storageRow = (
    action: Exclude<PendingAction, null>,
    label: string,
    hint: string,
    danger = false,
  ) => (
    <div className="settings-row">
      <div className="settings-row-text">
        <span>{label}</span>
        <small>{hint}</small>
      </div>
      <button className={danger ? 'btn btn-danger' : 'btn'} onClick={() => setPending(action)}>
        {doneAction === action ? t('settings.done') : label}
      </button>
    </div>
  );

  return (
    <div className="settings">
      <h2>{t('settings.title')}</h2>

      <section>
        <div className="settings-row">
          <div className="settings-row-text">
            <span>{t('settings.language')}</span>
            <small>{t('settings.languageHint')}</small>
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'ru')}>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <span>{t('settings.theme')}</span>
            <small>{t('settings.themeHint')}</small>
          </div>
          <select
            value={settings.theme}
            onChange={(e) => onSettingsChange({ ...settings, theme: e.target.value as AppTheme })}
          >
            <option value="system">{t('settings.themes.system')}</option>
            <option value="light">{t('settings.themes.light')}</option>
            <option value="dark">{t('settings.themes.dark')}</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <span>{t('settings.region')}</span>
            <small>{t('settings.regionHint')}</small>
          </div>
          <select
            value={settings.region}
            onChange={(e) => onSettingsChange({ ...settings, region: e.target.value as RegionId })}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {t(`settings.regions.${r.id}`)}
              </option>
            ))}
          </select>
        </div>

        {settings.region === 'custom' && (
          <div className="settings-row">
            <div className="settings-row-text">
              <span>{t('settings.customLocale')}</span>
              <small>{t('settings.customLocaleHint')}</small>
            </div>
            <input
              type="text"
              value={settings.customLocale}
              placeholder="ru-RU"
              onChange={(e) => onSettingsChange({ ...settings, customLocale: e.target.value })}
              spellCheck={false}
            />
          </div>
        )}

        <div className="settings-row">
          <div className="settings-row-text">
            <span>{t('settings.saveHistory')}</span>
          </div>
          <input
            type="checkbox"
            checked={settings.saveHistory}
            onChange={(e) => onSettingsChange({ ...settings, saveHistory: e.target.checked })}
          />
        </div>
      </section>

      <section>
        <h3>{t('settings.sidebarTitle')}</h3>
        <p className="settings-hint">{t('settings.sidebarHint')}</p>
        {settings.sidebarOrder.map((cat: ToolCategory, index: number) => (
          <div className="settings-row" key={cat}>
            <div className="settings-row-text">
              <span>{t(`categories.${cat}`)}</span>
            </div>
            <div className="sidebar-controls">
              <button
                className="btn btn-ghost"
                disabled={index === 0}
                onClick={() => {
                  const order = [...settings.sidebarOrder];
                  [order[index - 1], order[index]] = [order[index], order[index - 1]];
                  onSettingsChange({ ...settings, sidebarOrder: order });
                }}
              >
                {t('settings.moveUp')}
              </button>
              <button
                className="btn btn-ghost"
                disabled={index === settings.sidebarOrder.length - 1}
                onClick={() => {
                  const order = [...settings.sidebarOrder];
                  [order[index], order[index + 1]] = [order[index + 1], order[index]];
                  onSettingsChange({ ...settings, sidebarOrder: order });
                }}
              >
                {t('settings.moveDown')}
              </button>
              <input
                type="checkbox"
                checked={settings.sidebarEnabled[cat] !== false}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    sidebarEnabled: { ...settings.sidebarEnabled, [cat]: e.target.checked },
                  })
                }
              />
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3>{t('settings.storage')}</h3>
        <p className="settings-hint">{t('settings.storageHint')}</p>
        {storageRow('cache', t('settings.clearCache'), t('settings.clearCacheHint'))}
        {storageRow('history', t('settings.clearHistory'), t('settings.clearHistoryHint'))}
        {storageRow('reports', t('settings.clearReports'), t('settings.clearReportsHint'))}
        {storageRow('reset', t('settings.resetApp'), t('settings.resetAppHint'), true)}

        <div className="settings-row">
          <div className="settings-row-text">
            <span>{t('settings.clearCacheOnQuit')}</span>
            <small>{t('settings.clearCacheOnQuitHint')}</small>
          </div>
          <input
            type="checkbox"
            checked={settings.clearCacheOnQuit}
            onChange={(e) => onSettingsChange({ ...settings, clearCacheOnQuit: e.target.checked })}
          />
        </div>
      </section>

      <section>
        <h3>{t('settings.privacyTitle')}</h3>
        <p className="settings-hint">{t('settings.privacyBody')}</p>
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending === 'reset'
            ? t('settings.confirmTitle')
            : pending === 'cache'
              ? t('settings.clearCache')
              : pending === 'history'
                ? t('settings.clearHistory')
                : pending === 'reports'
                  ? t('settings.clearReports')
                  : ''
        }
        body={pending ? confirmBody[pending] : ''}
        cancelLabel={t('settings.cancel')}
        confirmLabel={pending === 'reset' ? t('settings.deleteEverything') : t('settings.confirmAction')}
        danger={pending === 'reset'}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && execute(pending)}
      />
    </div>
  );
}
