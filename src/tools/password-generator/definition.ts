import type { ToolDefinition } from '../../types/tool';
import { passwordProcessor } from '../../processors/generators';

export const passwordGeneratorTool: ToolDefinition = {
  id: 'password-generator',
  category: 'generators',
  keywords: ['password', 'generator', 'secure', 'пароль', 'генератор', 'случайный'],
  processor: passwordProcessor,
  noInput: true,
  options: [
    { kind: 'text', id: 'length', labelKey: 'length', default: '16' },
    { kind: 'text', id: 'count', labelKey: 'count', default: '5' },
    { kind: 'toggle', id: 'lowercase', labelKey: 'lowercase', default: true },
    { kind: 'toggle', id: 'uppercase', labelKey: 'uppercase', default: true },
    { kind: 'toggle', id: 'numbers', labelKey: 'numbers', default: true },
    { kind: 'toggle', id: 'symbols', labelKey: 'symbols', default: false },
  ],
};
