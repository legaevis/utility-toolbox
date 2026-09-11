import { useI18n } from '../localization/i18n';

/** Help / About — the app is free, offline and collects nothing. */
export function InfoView() {
  const { t } = useI18n();
  return (
    <div className="panel-view info-view">
      <h2>{t('app.name')}</h2>
      <p className="info-tagline">{t('app.tagline')}</p>

      <section>
        <h3>{t('info.freeTitle')}</h3>
        <p>{t('info.freeBody')}</p>
      </section>

      <section>
        <h3>{t('info.privacyTitle')}</h3>
        <p>{t('info.privacyBody')}</p>
      </section>

      <section>
        <h3>{t('info.offlineTitle')}</h3>
        <p>{t('info.offlineBody')}</p>
      </section>

      <p className="info-version">
        {t('info.versionLabel')} {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : ''}
      </p>
    </div>
  );
}
