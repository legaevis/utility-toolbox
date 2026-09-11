import { useMemo, useState } from 'react';
import { useI18n } from '../localization/i18n';
import { TOOLS, getTool } from '../registry/toolRegistry';
import { searchTools } from '../registry/search';
import type { ToolDefinition } from '../types/tool';
import type { SidebarSection } from './Sidebar';
import { IconSearch } from '../components/icons';

/**
 * Middle column (per mockup): search on top, then the tool cards of the
 * active sidebar section. Search results span ALL tools regardless of the
 * selected section, so hidden categories stay reachable.
 */
export function ToolListColumn({
  section,
  favorites,
  archivedTools,
  activeToolId,
  onOpenTool,
}: {
  section: SidebarSection;
  favorites: string[];
  /** Archived tools are hidden everywhere here; restore them in Archive. */
  archivedTools: string[];
  activeToolId: string | null;
  onOpenTool: (id: string) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';

  const tools: ToolDefinition[] = useMemo(() => {
    let list: ToolDefinition[];
    if (searching) list = searchTools(query);
    else if (section === 'favorites') {
      list = favorites.map(getTool).filter((x): x is ToolDefinition => !!x);
    } else {
      list = TOOLS.filter((tool) => tool.category === section);
    }
    // Pinned tools (Typograf, Daily Report) live in the sidebar — hide them
    // from category/favorites lists (search still finds them and routes to
    // their pinned section).
    if (!searching) list = list.filter((tool) => tool.id !== 'typography' && tool.id !== 'daily-report');
    return list.filter((tool) => !archivedTools.includes(tool.id));
  }, [searching, query, section, favorites, archivedTools]);

  return (
    <section className="tool-list-column">
      <div className="search-bar">
        <input
          type="search"
          value={query}
          placeholder={t('nav.searchPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        <span className="search-icon">
          <IconSearch />
        </span>
      </div>

      <div className="tool-cards">
        {tools.length === 0 && (
          <p className="empty-hint">
            {searching ? t('nav.noResults') : t('nav.noFavorites')}
          </p>
        )}
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={tool.id === activeToolId ? 'tool-card active' : 'tool-card'}
            onClick={() => onOpenTool(tool.id)}
          >
            <span className="tool-card-name">{t(`tools.${tool.id}.name`)}</span>
            <span className="tool-card-desc">{t(`tools.${tool.id}.description`)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
