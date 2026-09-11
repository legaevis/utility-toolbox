import type { ToolDefinition } from '../../types/tool';
import { wordsToColumnProcessor } from '../../processors/listFormatting';

export const wordsToColumnTool: ToolDefinition = {
  id: 'words-to-column',
  category: 'lists',
  keywords: [
    'words', 'column', 'split', 'lines', 'case', 'camel',
    'слова', 'столбец', 'столбик', 'разбить', 'регистр', 'склеенный',
  ],
  processor: wordsToColumnProcessor,
  modes: [{ value: 'words' }, { value: 'case' }],
};
