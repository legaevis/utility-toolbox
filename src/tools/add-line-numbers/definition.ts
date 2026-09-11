import type { ToolDefinition } from '../../types/tool';
import { addLineNumbersProcessor } from '../../processors/listFormatting';

export const addLineNumbersTool: ToolDefinition = {
  id: 'add-line-numbers',
  category: 'formatting',
  keywords: ['line numbers', 'numbering', 'numbered', 'нумерация', 'номера строк', 'пронумеровать'],
  processor: addLineNumbersProcessor,
  options: [
    {
      kind: 'select',
      id: 'style',
      labelKey: 'style',
      choices: [
        { value: 'arabic', labelKey: 'styleArabic' },
        { value: 'letters', labelKey: 'styleLetters' },
        { value: 'roman', labelKey: 'styleRoman' },
      ],
      default: 'arabic',
    },
    { kind: 'text', id: 'start', labelKey: 'start', default: '1' },
    { kind: 'toggle', id: 'skipEmpty', labelKey: 'skipEmpty', default: false },
  ],
};
