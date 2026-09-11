import type { ToolDefinition } from '../../types/tool';
import { layoutSwitcherProcessor } from '../../processors/layoutSwitcher';

export const keyboardSwitcher: ToolDefinition = {
  id: 'keyboard-switcher',
  category: 'text',
  keywords: ['keyboard', 'layout', 'qwerty', 'ghbdtn', 'раскладка', 'клавиатура', 'йцукен', 'привет'],
  processor: layoutSwitcherProcessor,
  modes: [{ value: 'auto' }, { value: 'en2ru' }, { value: 'ru2en' }],
};
