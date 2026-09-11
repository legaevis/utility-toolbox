import type { ToolDefinition } from '../../types/tool';
import { sortListProcessor } from '../../processors/sortList';

export const sortListTool: ToolDefinition = {
  id: 'sort-list',
  category: 'lists',
  keywords: ['sort', 'alphabetical', 'numeric', 'order', 'сортировка', 'алфавит', 'по порядку'],
  processor: sortListProcessor,
  modes: [
    { value: 'az' },
    { value: 'za' },
    { value: 'shortest' },
    { value: 'longest' },
    { value: 'numAsc' },
    { value: 'numDesc' },
  ],
  options: [
    { kind: 'toggle', id: 'caseSensitive', labelKey: 'caseSensitive', default: false },
    { kind: 'toggle', id: 'ignoreEmptyLines', labelKey: 'ignoreEmptyLines', default: true },
    { kind: 'toggle', id: 'trim', labelKey: 'trim', default: false },
  ],
};
