import type { ToolDefinition } from '../../types/tool';
import { replaceQuotesProcessor } from '../../processors/replaceQuotes';

export const replaceQuotesTool: ToolDefinition = {
  id: 'replace-quotes',
  category: 'formatting',
  keywords: ['quotes', 'guillemets', 'curly', 'straight', 'кавычки', 'ёлочки', 'лапки'],
  processor: replaceQuotesProcessor,
  modes: [{ value: 'guillemet' }, { value: 'curly' }, { value: 'straight' }],
};
