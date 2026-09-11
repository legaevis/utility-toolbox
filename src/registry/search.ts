import type { ToolDefinition } from '../types/tool';
import { LOCALES, resolveKey } from '../localization/i18n';
import { TOOLS } from './toolRegistry';

/**
 * Global tool search. Matches against:
 *   - tool id
 *   - keywords (already bilingual)
 *   - name and description from BOTH locales,
 * so "раскладка" finds Keyboard Layout Switcher even in the English UI.
 */
export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (q === '') return TOOLS;

  const scored: { tool: ToolDefinition; score: number }[] = [];

  for (const tool of TOOLS) {
    const haystacks: { text: string; weight: number }[] = [
      { text: tool.id, weight: 3 },
      ...tool.keywords.map((k) => ({ text: k, weight: 2 })),
    ];
    for (const locale of Object.values(LOCALES)) {
      const name = resolveKey(locale, `tools.${tool.id}.name`);
      const description = resolveKey(locale, `tools.${tool.id}.description`);
      if (name) haystacks.push({ text: name.toLowerCase(), weight: 3 });
      if (description) haystacks.push({ text: description.toLowerCase(), weight: 1 });
    }

    let score = 0;
    for (const h of haystacks) {
      if (h.text === q) score = Math.max(score, h.weight * 3);
      else if (h.text.startsWith(q)) score = Math.max(score, h.weight * 2);
      else if (h.text.includes(q)) score = Math.max(score, h.weight);
    }
    if (score > 0) scored.push({ tool, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.tool);
}
