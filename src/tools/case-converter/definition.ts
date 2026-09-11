import type { ToolDefinition } from '../../types/tool';
import { caseConverterProcessor } from '../../processors/caseConverter';

export const caseConverter: ToolDefinition = {
  id: 'case-converter',
  category: 'text',
  keywords: ['case', 'uppercase', 'lowercase', 'title', 'sentence', 'регистр', 'заглавные', 'прописные', 'строчные', 'капс'],
  processor: caseConverterProcessor,
  modes: [
    { value: 'upper' },
    { value: 'lower' },
    { value: 'title' },
    { value: 'sentence' },
    { value: 'inverse' },
    { value: 'capitalizeWords' },
    { value: 'capitalizeFirst' },
  ],
};
