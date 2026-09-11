import type { ToolDefinition } from '../../types/tool';
import { transliterationProcessor } from '../../processors/transliteration';

export const transliterationTool: ToolDefinition = {
  id: 'transliteration',
  category: 'text',
  keywords: ['transliteration', 'translit', 'latin', 'cyrillic', 'транслит', 'транслитерация', 'латиница', 'кириллица'],
  processor: transliterationProcessor,
  modes: [{ value: 'ru2lat' }, { value: 'lat2ru' }],
  options: [
    {
      kind: 'select',
      id: 'scheme',
      labelKey: 'scheme',
      choices: [
        { value: 'common', labelKey: 'schemeCommon' },
        { value: 'passport', labelKey: 'schemePassport' },
      ],
      default: 'common',
    },
  ],
};
