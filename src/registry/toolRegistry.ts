import type { ToolCategory, ToolDefinition } from '../types/tool';
import { caseConverter } from '../tools/case-converter/definition';
import { keyboardSwitcher } from '../tools/keyboard-switcher/definition';
import { textCleaner } from '../tools/text-cleaner/definition';
import { characterCounter } from '../tools/character-counter/definition';
import { removeDuplicatesTool } from '../tools/remove-duplicates/definition';
import { sortListTool } from '../tools/sort-list/definition';
import { compareListsTool } from '../tools/compare-lists/definition';
import { findReplaceTool } from '../tools/find-replace/definition';
import { typographyTool } from '../tools/typography/definition';
import { transliterationTool } from '../tools/transliteration/definition';
import { extractorTool } from '../tools/extractor/definition';
import { dailyReportTool } from '../tools/daily-report/definition';
import { wordsToColumnTool } from '../tools/words-to-column/definition';
import { mergeLinesTool } from '../tools/merge-lines/definition';
import { reverseListTool } from '../tools/reverse-list/definition';
import { addLineNumbersTool } from '../tools/add-line-numbers/definition';
import { replaceQuotesTool } from '../tools/replace-quotes/definition';
import { tabsSpacesTool } from '../tools/tabs-spaces/definition';
import { insertTextTool } from '../tools/insert-text/definition';
import { passwordGeneratorTool } from '../tools/password-generator/definition';
import { randomStringTool } from '../tools/random-string/definition';
import { randomWordsTool } from '../tools/random-words/definition';
import { randomNumbersTool } from '../tools/random-numbers/definition';
import { placeholderTextTool } from '../tools/placeholder-text/definition';
import { emailGeneratorTool } from '../tools/email-generator/definition';
import { spellCheckerTool } from '../tools/spell-checker/definition';
import { unitConverterTool } from '../tools/unit-converter/definition';
import { worldClockTool } from '../tools/world-clock/definition';
import { timeZoneConverterTool } from '../tools/timezone-converter/definition';
import { dateTimeFormatterTool } from '../tools/datetime-formatter/definition';

/**
 * The single registry. Adding a tool = adding a definition here
 * (plus its processor and locale strings). Nothing else changes.
 */
export const TOOLS: ToolDefinition[] = [
  caseConverter,
  keyboardSwitcher,
  textCleaner,
  characterCounter,
  removeDuplicatesTool,
  sortListTool,
  compareListsTool,
  findReplaceTool,
  typographyTool,
  transliterationTool,
  extractorTool,
  dailyReportTool,
  // Text
  wordsToColumnTool,
  spellCheckerTool,
  // Lists
  mergeLinesTool,
  reverseListTool,
  // Formatting
  addLineNumbersTool,
  replaceQuotesTool,
  tabsSpacesTool,
  insertTextTool,
  // Encoding
  // Converters
  unitConverterTool,
  // Time & Date
  worldClockTool,
  timeZoneConverterTool,
  dateTimeFormatterTool,
  // Generators
  passwordGeneratorTool,
  randomStringTool,
  randomWordsTool,
  randomNumbersTool,
  placeholderTextTool,
  emailGeneratorTool,
];

export const CATEGORY_ORDER: ToolCategory[] = ['text', 'lists', 'formatting', 'converters', 'generators', 'extractors', 'time'];

export function getTool(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function toolsByCategory(): Map<ToolCategory, ToolDefinition[]> {
  const map = new Map<ToolCategory, ToolDefinition[]>();
  for (const cat of CATEGORY_ORDER) map.set(cat, []);
  for (const tool of TOOLS) {
    map.get(tool.category)?.push(tool);
  }
  return map;
}
