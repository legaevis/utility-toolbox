import type { ToolDefinition } from '../../types/tool';
import { insertTextProcessor } from '../../processors/listFormatting';

export const insertTextTool: ToolDefinition = {
  id: 'insert-text',
  category: 'formatting',
  keywords: ['insert', 'prefix', 'suffix', 'prepend', 'append', 'вставить', 'префикс', 'суффикс', 'добавить'],
  processor: insertTextProcessor,
  options: [
    { kind: 'text', id: 'prefix', labelKey: 'prefix', default: '' },
    { kind: 'text', id: 'suffix', labelKey: 'suffix', default: '' },
    { kind: 'toggle', id: 'skipEmpty', labelKey: 'skipEmpty', default: true },
  ],
};
