import { useI18n } from '../localization/i18n';
import { getTool } from '../registry/toolRegistry';
import type { ToolDefinition } from '../types/tool';

/**
 * Archive — archived TOOLS only (hidden from the tool lists via the toolbar
 * chip), restorable with one click. Daily Report entries have their own
 * archive inside the pinned Daily Report section (sub-item «Архив»).
 */
export function ArchiveView({
  archivedTools,
  onRestore,
}: {
  archivedTools: string[];
  onRestore: (toolId: string) => void;
}) {
  const { t } = useI18n();
  const archivedDefs = archivedTools
    .map(getTool)
    .filter((x): x is ToolDefinition => !!x);

  return (
    <div className="panel-view">
      <h2>{t('nav.archive')}</h2>

      <h3 className="archive-section-title">{t('archive.toolsTitle')}</h3>
      <p className="settings-hint">{t('archive.toolsHint')}</p>
      {archivedDefs.length === 0 && <p className="empty-hint">{t('archive.noArchivedTools')}</p>}
      {archivedDefs.map((tool) => (
        <div key={tool.id} className="archived-tool-row">
          <div className="archived-tool-text">
            <span className="tool-card-name">{t(`tools.${tool.id}.name`)}</span>
            <span className="tool-card-desc">{t(`tools.${tool.id}.description`)}</span>
          </div>
          <button className="btn" onClick={() => onRestore(tool.id)}>
            {t('archive.restore')}
          </button>
        </div>
      ))}
    </div>
  );
}
