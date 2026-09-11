import type { ToolDefinition } from '../../types/tool';
import { TimeZoneConverter } from './TimeZoneConverter';

export const timeZoneConverterTool: ToolDefinition = {
  id: 'timezone-converter',
  category: 'time',
  keywords: ['timezone', 'convert', 'time', 'zone', 'utc', 'gmt', 'таймзона', 'часовой пояс', 'разница', 'время'],
  component: TimeZoneConverter,
};
