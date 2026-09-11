/** Shared line helpers used by list-based processors. */

export function splitLines(text: string): string[] {
  if (text === '') return [];
  return text.split(/\r\n|\r|\n/);
}

export function joinLines(lines: string[]): string {
  return lines.join('\n');
}
