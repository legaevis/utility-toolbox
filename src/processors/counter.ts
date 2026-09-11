export interface TextStats {
  characters: number;
  charactersWithoutSpaces: number;
  words: number;
  lines: number;
}

/** Counts user-perceived characters (grapheme clusters) when the runtime
 *  supports Intl.Segmenter, so emoji and combined characters count as 1. */
function countGraphemes(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    let n = 0;
    for (const _ of seg.segment(text)) n++;
    return n;
  }
  return [...text].length; // code points fallback
}

export function countText(text: string): TextStats {
  if (text === '') {
    return { characters: 0, charactersWithoutSpaces: 0, words: 0, lines: 0 };
  }
  const characters = countGraphemes(text);
  const charactersWithoutSpaces = countGraphemes(text.replace(/\s/gu, ''));
  const words = (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
  const lines = text.split(/\r\n|\r|\n/).length;
  return { characters, charactersWithoutSpaces, words, lines };
}
