import type { ToolDefinition } from '../../types/tool';
import { CharacterCounter } from './CharacterCounter';

export const characterCounter: ToolDefinition = {
  id: 'character-counter',
  category: 'text',
  keywords: ['count', 'characters', 'words', 'lines', 'length', 'счётчик', 'символы', 'слова', 'строки', 'знаки'],
  component: CharacterCounter,
};
