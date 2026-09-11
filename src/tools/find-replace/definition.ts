import type { ToolDefinition } from '../../types/tool';
import { FindReplace } from './FindReplace';

export const findReplaceTool: ToolDefinition = {
  id: 'find-replace',
  category: 'text',
  keywords: ['find', 'replace', 'search', 'substitute', 'найти', 'заменить', 'замена', 'поиск'],
  component: FindReplace,
};
