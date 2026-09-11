import type { ToolDefinition } from '../../types/tool';
import { emailGeneratorProcessor } from '../../processors/generators';

export const emailGeneratorTool: ToolDefinition = {
  id: 'email-generator',
  category: 'generators',
  keywords: ['email', 'generator', 'test', 'fake', 'почта', 'тестовые', 'адреса'],
  processor: emailGeneratorProcessor,
  noInput: true,
  options: [{ kind: 'text', id: 'count', labelKey: 'count', default: '5' }],
};
