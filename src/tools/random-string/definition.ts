import type { ToolDefinition } from '../../types/tool';
import { randomStringProcessor } from '../../processors/generators';

export const randomStringTool: ToolDefinition = {
  id: 'random-string',
  category: 'generators',
  keywords: ['random', 'string', 'token', 'id', 'случайная', 'строка', 'токен'],
  processor: randomStringProcessor,
  noInput: true,
  options: [
    { kind: 'text', id: 'length', labelKey: 'length', default: '32' },
    { kind: 'text', id: 'count', labelKey: 'count', default: '5' },
    {
      kind: 'select',
      id: 'charset',
      labelKey: 'charset',
      choices: [
        { value: 'alphanumeric', labelKey: 'charsetAlphanumeric' },
        { value: 'letters', labelKey: 'charsetLetters' },
        { value: 'digits', labelKey: 'charsetDigits' },
        { value: 'hex', labelKey: 'charsetHex' },
        { value: 'custom', labelKey: 'charsetCustom' },
      ],
      default: 'alphanumeric',
    },
    { kind: 'text', id: 'custom', labelKey: 'customCharset', default: '' },
  ],
};
