import type { ToolDefinition } from '../../types/tool';
import { tabsSpacesProcessor } from '../../processors/listFormatting';

export const tabsSpacesTool: ToolDefinition = {
  id: 'tabs-spaces',
  category: 'formatting',
  keywords: ['tabs', 'spaces', 'indent', 'табуляция', 'табы', 'пробелы', 'отступы'],
  processor: tabsSpacesProcessor,
  modes: [{ value: 'tabs2spaces' }, { value: 'spaces2tabs' }],
  options: [
    {
      kind: 'select',
      id: 'tabWidth',
      labelKey: 'tabWidth',
      choices: [
        { value: '2', labelKey: 'width2' },
        { value: '4', labelKey: 'width4' },
        { value: '8', labelKey: 'width8' },
      ],
      default: '4',
    },
  ],
};
