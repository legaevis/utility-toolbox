import type { ToolDefinition } from '../../types/tool';
import { randomNumbersProcessor } from '../../processors/generators';

export const randomNumbersTool: ToolDefinition = {
  id: 'random-numbers',
  category: 'generators',
  keywords: ['random', 'numbers', 'integer', 'decimal', 'случайные', 'числа', 'диапазон'],
  processor: randomNumbersProcessor,
  noInput: true,
  options: [
    { kind: 'text', id: 'min', labelKey: 'min', default: '1' },
    { kind: 'text', id: 'max', labelKey: 'max', default: '100' },
    { kind: 'text', id: 'amount', labelKey: 'amount', default: '10' },
    { kind: 'toggle', id: 'decimals', labelKey: 'decimals', default: false },
  ],
};
