import type { ToolDefinition } from '../../types/tool';
import { placeholderProcessor } from '../../processors/generators';

export const placeholderTextTool: ToolDefinition = {
  id: 'placeholder-text',
  category: 'generators',
  keywords: ['lorem', 'ipsum', 'placeholder', 'dummy', 'рыба', 'текст-заполнитель', 'лорем'],
  processor: placeholderProcessor,
  noInput: true,
  options: [
    {
      kind: 'select',
      id: 'unit',
      labelKey: 'unit',
      choices: [
        { value: 'words', labelKey: 'unitWords' },
        { value: 'sentences', labelKey: 'unitSentences' },
        { value: 'paragraphs', labelKey: 'unitParagraphs' },
      ],
      default: 'paragraphs',
    },
    { kind: 'text', id: 'amount', labelKey: 'amount', default: '3' },
  ],
};
