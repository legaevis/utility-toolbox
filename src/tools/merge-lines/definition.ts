import type { ToolDefinition } from '../../types/tool';
import { mergeLinesProcessor } from '../../processors/listFormatting';

export const mergeLinesTool: ToolDefinition = {
  id: 'merge-lines',
  category: 'lists',
  keywords: ['merge', 'join', 'combine', 'lines', 'объединить', 'слить', 'склеить', 'строки'],
  processor: mergeLinesProcessor,
  options: [
    {
      kind: 'select',
      id: 'separator',
      labelKey: 'separator',
      choices: [
        { value: 'space', labelKey: 'sepSpace' },
        { value: 'comma', labelKey: 'sepComma' },
        { value: 'semicolon', labelKey: 'sepSemicolon' },
        { value: 'custom', labelKey: 'sepCustom' },
      ],
      default: 'space',
    },
    { kind: 'text', id: 'customSeparator', labelKey: 'customSeparator', default: '' },
    { kind: 'toggle', id: 'skipEmpty', labelKey: 'skipEmpty', default: true },
  ],
};
