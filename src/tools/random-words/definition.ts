import type { ToolDefinition } from '../../types/tool';
import { randomWordsProcessor } from '../../processors/generators';

export const randomWordsTool: ToolDefinition = {
  id: 'random-words',
  category: 'generators',
  keywords: ['random', 'words', 'случайные', 'слова', 'генератор'],
  processor: randomWordsProcessor,
  noInput: true,
  options: [
    { kind: 'text', id: 'count', labelKey: 'count', default: '10' },
    {
      kind: 'select',
      id: 'wordLength',
      labelKey: 'wordLength',
      choices: [
        { value: 'short', labelKey: 'lenShort' },
        { value: 'medium', labelKey: 'lenMedium' },
        { value: 'long', labelKey: 'lenLong' },
      ],
      default: 'medium',
    },
  ],
};
