import { useI18n } from '../localization/i18n';
import type { ToolCategory } from '../types/tool';
import {
  IconArchive,
  IconFolder,
  IconHelp,
  IconReport,
  IconSettings,
  IconStar,
  IconType,
} from '../components/icons';

export type SidebarSection = 'favorites' | ToolCategory;
export type SidebarPanel = 'typograf' | 'daily' | 'archive' | 'info' | 'settings';

/**
 * Left rail (per mockup): brand, pinned Favorites, pinned Typograf (the
 * flagship tool — opens full-width like a panel), the TOOLS category list
 * (user-configurable via Settings → Sidebar), and at the bottom:
 * Archive, Help (info) and Settings — these open full-width panels.
 *
 * Design 3.0: the rail always lives inside the navigation overlay opened
 * by the top-left toggle button (see App.tsx).
 */
export function Sidebar({
  section,
  panel,
  sidebarOrder,
  sidebarEnabled,
  onSelectSection,
  onOpenPanel,
}: {
  section: SidebarSection;
  panel: SidebarPanel | null;
  sidebarOrder: ToolCategory[];
  sidebarEnabled: Record<ToolCategory, boolean>;
  onSelectSection: (s: SidebarSection) => void;
  onOpenPanel: (p: SidebarPanel) => void;
}) {
  const { t } = useI18n();
  const active = (s: SidebarSection) => panel === null && section === s;

  return (
    <aside className="sidebar">
      <div className="app-title">{t('app.name')}</div>

      <nav className="nav">
        {/* Pinned block — tight 2px gaps like the category list (39-108). */}
        <div className="nav-list">
          <button
            className={active('favorites') ? 'nav-item active' : 'nav-item'}
            onClick={() => onSelectSection('favorites')}
          >
            <span className="nav-icon">
              <IconStar />
            </span>
            {t('nav.favorites')}
          </button>
          <button
            className={panel === 'typograf' ? 'nav-item active' : 'nav-item'}
            onClick={() => onOpenPanel('typograf')}
          >
            <span className="nav-icon">
              <IconType />
            </span>
            {t('tools.typography.name')}
          </button>
          <button
            className={panel === 'daily' ? 'nav-item active' : 'nav-item'}
            onClick={() => onOpenPanel('daily')}
          >
            <span className="nav-icon">
              <IconReport />
            </span>
            {t('tools.daily-report.name')}
          </button>
        </div>

        <div className="nav-section-label">{t('nav.tools')}</div>

        <div className="nav-list">
          {sidebarOrder
            .filter((cat) => sidebarEnabled[cat])
            .map((cat) => (
              <button
                key={cat}
                className={active(cat) ? 'nav-item active' : 'nav-item'}
                onClick={() => onSelectSection(cat)}
              >
                <span className="nav-icon">
                  <IconFolder />
                </span>
                {t(`categories.${cat}`)}
              </button>
            ))}
        </div>
      </nav>

      <div className="nav-bottom">
        <button
          className={panel === 'archive' ? 'nav-item active' : 'nav-item'}
          onClick={() => onOpenPanel('archive')}
        >
          <span className="nav-icon">
            <IconArchive />
          </span>
          {t('nav.archive')}
        </button>
        <button
          className={panel === 'info' ? 'nav-item active' : 'nav-item'}
          onClick={() => onOpenPanel('info')}
        >
          <span className="nav-icon">
            <IconHelp />
          </span>
          {t('nav.help')}
        </button>
        <button
          className={panel === 'settings' ? 'nav-item active' : 'nav-item'}
          onClick={() => onOpenPanel('settings')}
        >
          <span className="nav-icon">
            <IconSettings />
          </span>
          {t('nav.settings')}
        </button>
      </div>
    </aside>
  );
}
