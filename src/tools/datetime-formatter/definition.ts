import type { ToolDefinition } from '../../types/tool';
import { DateTimeFormatter } from './DateTimeFormatter';

export const dateTimeFormatterTool: ToolDefinition = {
  id: 'datetime-formatter',
  category: 'time',
  keywords: ['date', 'format', 'locale', 'region', 'дата', 'формат', 'регион', 'число'],
  component: DateTimeFormatter,
};
