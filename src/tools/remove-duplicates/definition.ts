import type { ToolDefinition } from '../../types/tool';
import { removeDuplicatesProcessor } from '../../processors/removeDuplicates';

export const removeDuplicatesTool: ToolDefinition = {
  id: 'remove-duplicates',
  category: 'lists',
  keywords: ['duplicates', 'unique', 'dedupe', 'дубликаты', 'повторы', 'уникальные'],
  processor: removeDuplicatesProcessor,
  options: [
    { kind: 'toggle', id: 'caseSensitive', labelKey: 'caseSensitive', default: false },
    {
      kind: 'select',
      id: 'keep',
      labelKey: 'keep',
      choices: [
        { value: 'first', labelKey: 'keepFirst' },
        { value: 'last', labelKey: 'keepLast' },
      ],
      default: 'first',
    },
    { kind: 'toggle', id: 'ignoreSurroundingSpaces', labelKey: 'ignoreSurroundingSpaces', default: false },
  ],
};
