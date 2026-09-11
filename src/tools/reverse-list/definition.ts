import type { ToolDefinition } from '../../types/tool';
import { reverseListProcessor } from '../../processors/listFormatting';

export const reverseListTool: ToolDefinition = {
  id: 'reverse-list',
  category: 'lists',
  keywords: ['reverse', 'invert', 'order', 'перевернуть', 'обратный', 'порядок'],
  processor: reverseListProcessor,
};
