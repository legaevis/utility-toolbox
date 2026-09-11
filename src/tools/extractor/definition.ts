import type { ToolDefinition } from '../../types/tool';
import { extractorProcessor } from '../../processors/extractor';

export const extractorTool: ToolDefinition = {
  id: 'extractor',
  category: 'extractors',
  keywords: ['extract', 'email', 'url', 'links', 'извлечь', 'почта', 'ссылки', 'адреса'],
  processor: extractorProcessor,
  modes: [{ value: 'both' }, { value: 'emails' }, { value: 'urls' }],
  options: [{ kind: 'toggle', id: 'dedupe', labelKey: 'dedupe', default: true }],
};
