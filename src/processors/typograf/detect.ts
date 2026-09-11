/** Language detection for the Typograf engine — counts letters per script.
 *  Deliberately simple, deterministic and offline. */

export type TypografLanguage = 'ru' | 'en';

export function detectLanguage(text: string): TypografLanguage {
  let cyrillic = 0;
  let latin = 0;
  for (const ch of text) {
    if (ch >= 'а' && ch <= 'я') cyrillic++;
    else if (ch >= 'А' && ch <= 'Я') cyrillic++;
    else if (ch === 'ё' || ch === 'Ё') cyrillic++;
    else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) latin++;
  }
  return cyrillic >= latin ? 'ru' : 'en';
}
