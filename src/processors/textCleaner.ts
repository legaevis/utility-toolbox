import type { OptionValues, ProcessResult } from '../types/tool';

/**
 * Text Cleaner — independent, combinable cleanup operations.
 * Operations are applied in a fixed, sensible order (tabs → spaces first,
 * then space cleanup, then line-break cleanup) so combinations behave
 * predictably regardless of toggle order in the UI.
 */

export interface CleanOptions {
  replaceTabsWithSpaces?: boolean;
  removeTabs?: boolean;
  removeAllSpaces?: boolean;
  removeExtraSpaces?: boolean; // collapse runs of 2+ spaces to one
  trimLines?: boolean;
  removeEmptyLines?: boolean; // lines that are completely empty
  removeWhitespaceOnlyLines?: boolean; // lines containing only whitespace
  removeAllLineBreaks?: boolean;
  replaceLineBreaksWithSpaces?: boolean;
  replaceSpacesWithLineBreaks?: boolean;
  removeSpacesAndLineBreaks?: boolean;
}

export function cleanText(text: string, o: CleanOptions): string {
  let t = text;

  // Normalize line endings first so all line operations are consistent.
  t = t.replace(/\r\n|\r/g, '\n');

  if (o.removeSpacesAndLineBreaks) {
    return t.replace(/[ \t\u00A0\n]+/g, '');
  }

  if (o.replaceTabsWithSpaces) t = t.replace(/\t/g, ' ');
  if (o.removeTabs) t = t.replace(/\t/g, '');

  if (o.removeAllSpaces) t = t.replace(/[ \u00A0]+/g, '');
  if (o.removeExtraSpaces) t = t.replace(/[ \u00A0]{2,}/g, ' ');

  if (o.trimLines) {
    t = t
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }

  if (o.removeWhitespaceOnlyLines) {
    t = t
      .split('\n')
      .filter((line) => line === '' || /\S/.test(line))
      .join('\n');
    // Whitespace-only lines removed; truly empty lines kept unless also toggled.
  }

  if (o.removeEmptyLines) {
    t = t
      .split('\n')
      .filter((line) => /\S/.test(line))
      .join('\n');
  }

  if (o.replaceLineBreaksWithSpaces) t = t.replace(/\n+/g, ' ');
  if (o.removeAllLineBreaks) t = t.replace(/\n+/g, '');

  if (o.replaceSpacesWithLineBreaks) t = t.replace(/[ \u00A0]+/g, '\n');

  return t;
}

export function textCleanerProcessor(input: string, options: OptionValues): ProcessResult {
  return { output: cleanText(input, options as CleanOptions) };
}
