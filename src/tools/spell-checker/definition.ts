import type { ToolDefinition } from '../../types/tool';
import { SpellChecker } from './SpellChecker';

export const spellCheckerTool: ToolDefinition = {
  id: 'spell-checker',
  category: 'text',
  keywords: ['spell', 'spelling', 'checker', 'grammar', 'орфография', 'правописание', 'проверка', 'ошибки'],
  component: SpellChecker,
};
