import { useState, type ReactNode } from 'react';
import type { ToolDefinition } from '../types/tool';
import { useI18n } from '../localization/i18n';
import { IconArchive, IconHelp, IconStar } from './icons';

/**
 * Content-pane wrapper (per mockup): toolbar with the tool name and three
 * round chips — Help (per-tool guide), Archive (hide the tool from the
 * lists; restorable in the Archive panel) and the favorite star.
 */
export function ToolShell({
  tool,
  isFavorite = false,
  isArchived = false,
  pinned = false,
  onToggleFavorite,
  onToggleArchived,
  children,
}: {
  tool: ToolDefinition;
  isFavorite?: boolean;
  isArchived?: boolean;
  /** Pinned tools live in the sidebar itself (e.g. Typograf): the archive
   *  and favorite chips make no sense there, so only Help is shown. */
  pinned?: boolean;
  onToggleFavorite?: (id: string) => void;
  onToggleArchived?: (id: string) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="tool-shell">
      <header className="tool-toolbar">
        {/* 39-1010: the toolbar carries only the title — the description
            lives on the tool card / sub-navigation column. */}
        <div className="tool-toolbar-text">
          <h2>{t(`tools.${tool.id}.name`)}</h2>
        </div>
        {/* Slot for tool-provided toolbar controls (e.g. Typograf's
            «Живая обработка» switch) — filled via a portal. */}
        <div className="toolbar-slot" />
        {/* Chip order per the 39-1010 mockup: archive · help · star. */}
        <div className="tool-toolbar-chips">
          {!pinned && (
            <button
              className={isArchived ? 'chip-btn archive active' : 'chip-btn'}
              title={isArchived ? t('common.unarchiveTool') : t('common.archiveTool')}
              onClick={() => onToggleArchived?.(tool.id)}
            >
              <IconArchive />
            </button>
          )}
          <button
            className={helpOpen ? 'chip-btn active' : 'chip-btn'}
            title={t('common.help')}
            onClick={() => setHelpOpen(true)}
          >
            <IconHelp />
          </button>
          {!pinned && (
            <button
              className={isFavorite ? 'chip-btn star active' : 'chip-btn'}
              title={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
              onClick={() => onToggleFavorite?.(tool.id)}
            >
              <IconStar filled={isFavorite} />
            </button>
          )}
        </div>
      </header>

      {isArchived && !pinned && (
        <div className="archived-banner">
          {t('common.archivedBanner')}{' '}
          <button className="btn-link" onClick={() => onToggleArchived?.(tool.id)}>
            {t('archive.restore')}
          </button>
        </div>
      )}

      <div className="tool-body">{children}</div>

      {helpOpen && (
        <div className="dialog-backdrop" onClick={() => setHelpOpen(false)}>
          <div className="dialog help-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{t(`tools.${tool.id}.name`)}</h3>
            <div className="help-body">
              {t(`tools.${tool.id}.help`)
                .split('\n')
                .filter((p) => p.trim() !== '')
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-primary" onClick={() => setHelpOpen(false)} autoFocus>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
