import type { ToolDefinition } from '../../types/tool';
import { Typograf } from './Typograf';

/**
 * The Typograf section. Replaces the earlier declarative Typography
 * Formatter under the SAME id — one tool, no duplicates; favorites/archive
 * state carries over. The old pure processor (processors/typography.ts)
 * stays in the codebase because replace-quotes reuses its protect()/restore()
 * helpers and its tests still document that behavior.
 */
export const typographyTool: ToolDefinition = {
  id: 'typography',
  category: 'text',
  keywords: [
    'typography', 'typograf', 'quotes', 'dash', 'nbsp', 'symbols', 'punctuation',
    'типографика', 'типограф', 'кавычки', 'тире', 'ёлочки', 'пробелы', 'символы',
    'пунктуация', 'валюта', 'даты', 'телефон',
  ],
  component: Typograf,
};
