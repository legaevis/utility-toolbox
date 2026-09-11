import type { ToolDefinition } from '../../types/tool';
import { DailyReport } from './DailyReport';

export const dailyReportTool: ToolDefinition = {
  id: 'daily-report',
  // Pinned in the sidebar — never listed under a category; 'text' is a
  // placeholder to satisfy the ToolDefinition contract.
  category: 'text',
  keywords: ['report', 'daily', 'standup', 'log', 'journal', 'отчёт', 'дневник', 'записи', 'стендап'],
  component: DailyReport,
};
