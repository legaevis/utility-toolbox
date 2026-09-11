import type { ToolDefinition } from '../../types/tool';
import { CompareLists } from './CompareLists';

export const compareListsTool: ToolDefinition = {
  id: 'compare-lists',
  category: 'lists',
  keywords: ['compare', 'diff', 'lists', 'common', 'unique', 'сравнить', 'сравнение', 'разница', 'общие'],
  component: CompareLists,
};
