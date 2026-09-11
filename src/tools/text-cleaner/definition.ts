import type { ToolDefinition } from '../../types/tool';
import { textCleanerProcessor } from '../../processors/textCleaner';

export const textCleaner: ToolDefinition = {
  id: 'text-cleaner',
  category: 'text',
  keywords: ['clean', 'spaces', 'whitespace', 'trim', 'line breaks', 'tabs', 'пробелы', 'очистка', 'переносы', 'табуляция'],
  processor: textCleanerProcessor,
  options: [
    { kind: 'toggle', id: 'removeExtraSpaces', labelKey: 'removeExtraSpaces', default: true },
    { kind: 'toggle', id: 'trimLines', labelKey: 'trimLines', default: true },
    { kind: 'toggle', id: 'removeEmptyLines', labelKey: 'removeEmptyLines', default: false },
    { kind: 'toggle', id: 'removeWhitespaceOnlyLines', labelKey: 'removeWhitespaceOnlyLines', default: false },
    { kind: 'toggle', id: 'removeAllSpaces', labelKey: 'removeAllSpaces', default: false },
    { kind: 'toggle', id: 'removeAllLineBreaks', labelKey: 'removeAllLineBreaks', default: false },
    { kind: 'toggle', id: 'replaceLineBreaksWithSpaces', labelKey: 'replaceLineBreaksWithSpaces', default: false },
    { kind: 'toggle', id: 'replaceSpacesWithLineBreaks', labelKey: 'replaceSpacesWithLineBreaks', default: false },
    { kind: 'toggle', id: 'removeTabs', labelKey: 'removeTabs', default: false },
    { kind: 'toggle', id: 'replaceTabsWithSpaces', labelKey: 'replaceTabsWithSpaces', default: false },
    { kind: 'toggle', id: 'removeSpacesAndLineBreaks', labelKey: 'removeSpacesAndLineBreaks', default: false },
  ],
};
