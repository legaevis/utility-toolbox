import { useCallback, useEffect, useState } from 'react';
import { I18nProvider } from '../localization/i18n';
import { LocaleProvider } from '../localization/LocaleContext';
import { loadSettings, saveSettings, type AppSettings } from '../storage/settings';
import { loadFavorites, toggleFavorite } from '../storage/favorites';
import { loadArchivedTools, toggleArchivedTool } from '../storage/archivedTools';
import { pushHistory } from '../storage/history';
import { clearCache } from '../storage/storage';
import { getTool } from '../registry/toolRegistry';
import { Sidebar, type SidebarSection, type SidebarPanel } from './Sidebar';
import { ToolListColumn } from './ToolListColumn';
import { SettingsView } from './SettingsView';
import { ArchiveView } from './ArchiveView';
import { InfoView } from './InfoView';
import { ToolShell } from '../components/ToolShell';
import { GenericTextTool } from '../components/GenericTextTool';
import { IconMenu } from '../components/icons';
import { Typograf } from '../tools/typography/Typograf';
import { DailyReport } from '../tools/daily-report/DailyReport';
import { ReportArchive } from '../tools/daily-report/ReportArchive';
import { useI18n } from '../localization/i18n';

/**
 * Design 3.0 layout (Figma node 88-13145):
 *   The content takes the WHOLE window. Navigation lives in an overlay
 *   opened by the top-left toggle button: [Sidebar | flyout column]
 *   (tool list of the active section, or the pinned section's sub-views),
 *   drawn OVER the content with a liquid-glass blur, closed by picking a
 *   tool/sub-view, by the backdrop, Esc, or the toggle again.
 * On macOS the toggle sits BELOW the traffic lights (they must never
 * overlap it) and the window uses vibrancy for the glass effect.
 */

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <h2>{t('app.name')}</h2>
      <p>{t('app.tagline')}</p>
    </div>
  );
}

/** Tools pinned in the sidebar — excluded from category lists; opening them
 *  (including from search) routes to their sidebar panel. */
export const PINNED_TOOL_IDS = ['typography', 'daily-report'] as const;

/**
 * Middle column of a pinned section: its sub-views (e.g. Типограф/Символы
 * for Typograf, Отчёт/Архив for the Daily Report) instead of a tool list.
 */
function PinnedNavColumn({
  titleKey,
  descriptionKey,
  items,
  active,
  onSelect,
}: {
  titleKey: string;
  descriptionKey: string;
  items: { id: string; labelKey: string }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="tool-list-column subnav-column">
      {/* 39-1010: the section name + description live at the top of the
          sub-navigation column (the toolbar shows only the title). */}
      <div className="subnav-header">
        <h3>{t(titleKey)}</h3>
        <p>{t(descriptionKey)}</p>
      </div>
      <div className="tool-cards">
        {items.map((item) => (
          <button
            key={item.id}
            className={item.id === active ? 'tool-card active' : 'tool-card'}
            onClick={() => onSelect(item.id)}
          >
            <span className="tool-card-name">{t(item.labelKey)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [archivedTools, setArchivedTools] = useState<string[]>(() => loadArchivedTools());
  const [section, setSection] = useState<SidebarSection>(() => {
    const s = loadSettings();
    return s.sidebarOrder.find((c) => s.sidebarEnabled[c]) ?? 'text';
  });
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [panel, setPanel] = useState<SidebarPanel | null>(null);
  // Sub-views of the pinned sections (chosen in their middle column).
  const [typografView, setTypografView] = useState<'text' | 'symbols'>('text');
  const [dailyView, setDailyView] = useState<'report' | 'archive'>('report');
  // Navigation overlay (design 3.0): opened by the toggle button, drawn
  // over the content. Starts open on a fresh launch (nothing selected yet).
  const [navOpen, setNavOpen] = useState(true);

  // macOS: glass (vibrancy) styling + clearance for the traffic lights.
  useEffect(() => {
    if (navigator.platform.toUpperCase().includes('MAC')) {
      document.documentElement.classList.add('is-mac');
    }
  }, []);

  // Esc closes the navigation overlay.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  // Theme: stamp the resolved theme on <html>; 'system' follows the OS live.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved =
        settings.theme === 'system' ? (media.matches ? 'light' : 'dark') : settings.theme;
      document.documentElement.dataset.theme = resolved;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.theme]);

  // Optional "clear cache on quit" — temporary cache only, never user data.
  useEffect(() => {
    const handler = () => {
      if (loadSettings().clearCacheOnQuit) clearCache();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const openTool = useCallback((toolId: string) => {
    // Pinned tools live in the sidebar; a search result click routes to
    // their section instead of the regular content pane.
    if (toolId === 'typography') {
      setActiveToolId(null);
      setPanel('typograf');
    } else if (toolId === 'daily-report') {
      setActiveToolId(null);
      setPanel('daily');
    } else {
      setActiveToolId(toolId);
      setPanel(null);
    }
    // Usage history is recorded internally (used by Clear History in
    // Settings); it is intentionally not shown anywhere in the UI.
    if (loadSettings().saveHistory) pushHistory(toolId);
  }, []);

  const onToggleFavorite = useCallback((toolId: string) => {
    setFavorites(toggleFavorite(toolId));
  }, []);

  const onToggleArchived = useCallback((toolId: string) => {
    setArchivedTools(toggleArchivedTool(toolId));
  }, []);

  const activeTool = activeToolId ? getTool(activeToolId) : undefined;
  const typografTool = getTool('typography');
  const dailyTool = getTool('daily-report');

  return (
    <I18nProvider
      initialLanguage={settings.language}
      onLanguageChange={(language) => updateSettings({ ...loadSettings(), language })}
    >
      <LocaleProvider region={settings.region} customLocale={settings.customLocale}>
        <div className="app">
          {/* macOS: draggable strip under the traffic lights. */}
          <div className="drag-strip" />
          {/* Scrolled content fades out under the system-button zone. */}
          <div className="top-fade" />
          <button
            className="nav-toggle-btn"
            aria-label="Menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <IconMenu />
          </button>
          {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
          {navOpen && (
            <div className="nav-overlay">
              <Sidebar
                section={section}
                panel={panel}
                sidebarOrder={settings.sidebarOrder}
                sidebarEnabled={settings.sidebarEnabled}
                onSelectSection={(s) => {
                  // Keep the overlay open — the flyout column shows the
                  // section's tools; picking a tool closes it.
                  setSection(s);
                  setPanel(null);
                }}
                onOpenPanel={(p) => {
                  setPanel(p);
                  // Pinned sections keep the overlay open to pick a
                  // sub-view; full views (Archive/Help/Settings) close it.
                  if (p !== 'typograf' && p !== 'daily') setNavOpen(false);
                }}
              />
              {panel === null && (
                <ToolListColumn
                  section={section}
                  favorites={favorites}
                  archivedTools={archivedTools}
                  activeToolId={activeToolId}
                  onOpenTool={(id) => {
                    openTool(id);
                    setNavOpen(false);
                  }}
                />
              )}
              {panel === 'typograf' && (
                <PinnedNavColumn
                  titleKey="tools.typography.name"
                  descriptionKey="tools.typography.description"
                  items={[
                    { id: 'text', labelKey: 'tools.typography.labels.tabText' },
                    { id: 'symbols', labelKey: 'tools.typography.labels.tabSymbols' },
                  ]}
                  active={typografView}
                  onSelect={(id) => {
                    setTypografView(id as 'text' | 'symbols');
                    setNavOpen(false);
                  }}
                />
              )}
              {panel === 'daily' && (
                <PinnedNavColumn
                  titleKey="tools.daily-report.name"
                  descriptionKey="tools.daily-report.description"
                  items={[
                    { id: 'report', labelKey: 'tools.daily-report.labels.report' },
                    { id: 'archive', labelKey: 'nav.archive' },
                  ]}
                  active={dailyView}
                  onSelect={(id) => {
                    setDailyView(id as 'report' | 'archive');
                    setNavOpen(false);
                  }}
                />
              )}
            </div>
          )}
          <main className="content">
            {panel === 'settings' ? (
              <SettingsView
                settings={settings}
                onSettingsChange={updateSettings}
                onDataCleared={() => {
                  setFavorites(loadFavorites());
                  setArchivedTools(loadArchivedTools());
                  setSettings(loadSettings());
                }}
              />
            ) : panel === 'typograf' && typografTool ? (
              <ToolShell key="typograf-pinned" tool={typografTool} pinned>
                <Typograf view={typografView} />
              </ToolShell>
            ) : panel === 'daily' && dailyTool ? (
              <ToolShell key="daily-pinned" tool={dailyTool} pinned>
                {dailyView === 'report' ? <DailyReport /> : <ReportArchive />}
              </ToolShell>
            ) : panel === 'archive' ? (
              <ArchiveView archivedTools={archivedTools} onRestore={onToggleArchived} />
            ) : panel === 'info' ? (
              <InfoView />
            ) : activeTool ? (
              <ToolShell
                key={activeTool.id}
                tool={activeTool}
                isFavorite={favorites.includes(activeTool.id)}
                isArchived={archivedTools.includes(activeTool.id)}
                onToggleFavorite={onToggleFavorite}
                onToggleArchived={onToggleArchived}
              >
                {activeTool.component ? <activeTool.component /> : <GenericTextTool tool={activeTool} />}
              </ToolShell>
            ) : (
              <EmptyState />
            )}
          </main>
        </div>
      </LocaleProvider>
    </I18nProvider>
  );
}
