import type { ToolDefinition } from '../../types/tool';
import { WorldClock } from './WorldClock';

export const worldClockTool: ToolDefinition = {
  id: 'world-clock',
  category: 'time',
  keywords: ['time', 'clock', 'world', 'city', 'timezone', 'время', 'часы', 'город', 'мировое'],
  component: WorldClock,
};
