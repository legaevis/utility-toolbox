import { describe, expect, it } from 'vitest';
import { linkify, linkifyToHtml, linkifyToPlain } from '../src/processors/linkify';

describe('linkify', () => {
  it('recognizes a bare URL without modifying it', () => {
    expect(linkify('https://example.com')).toEqual([
      { type: 'link', href: 'https://example.com', label: 'https://example.com' },
    ]);
  });

  it('keeps query parameters intact', () => {
    const url = 'https://example.com/page?id=123&test=true';
    expect(linkify(url)).toEqual([{ type: 'link', href: url, label: url }]);
  });

  it('handles text + link', () => {
    expect(linkify('Сделал макет: https://figma.com/file/123')).toEqual([
      { type: 'text', text: 'Сделал макет: ' },
      { type: 'link', href: 'https://figma.com/file/123', label: 'https://figma.com/file/123' },
    ]);
  });

  it('parses markdown links, keeping label and URL', () => {
    expect(linkify('[Макет](https://figma.com/file/123)')).toEqual([
      { type: 'link', href: 'https://figma.com/file/123', label: 'Макет' },
    ]);
  });

  it('handles several links in one line', () => {
    const segs = linkify('см. https://a.com и [Б](https://b.com) тут');
    expect(segs.filter((s) => s.type === 'link')).toEqual([
      { type: 'link', href: 'https://a.com', label: 'https://a.com' },
      { type: 'link', href: 'https://b.com', label: 'Б' },
    ]);
  });

  it('strips trailing sentence punctuation but not URL contents', () => {
    expect(linkify('открой https://www.figma.com/file/123.')).toEqual([
      { type: 'text', text: 'открой ' },
      { type: 'link', href: 'https://www.figma.com/file/123', label: 'https://www.figma.com/file/123' },
      { type: 'text', text: '.' },
    ]);
  });

  it('prefixes https:// for www links in href but keeps the visible label', () => {
    expect(linkify('www.example.com')).toEqual([
      { type: 'link', href: 'https://www.example.com', label: 'www.example.com' },
    ]);
  });

  it('plain rendering keeps working URLs', () => {
    expect(linkifyToPlain('https://example.com')).toBe('https://example.com');
    expect(linkifyToPlain('[Макет](https://figma.com/file/123)')).toBe(
      'Макет (https://figma.com/file/123)',
    );
  });

  it('html rendering produces real anchors and escapes text', () => {
    expect(linkifyToHtml('a <b> https://ex.com?a=1&b=2')).toBe(
      'a &lt;b&gt; <a href="https://ex.com?a=1&amp;b=2">https://ex.com?a=1&amp;b=2</a>',
    );
  });

  it('returns plain text unchanged when there are no links', () => {
    expect(linkify('просто текст')).toEqual([{ type: 'text', text: 'просто текст' }]);
    expect(linkifyToPlain('просто текст')).toBe('просто текст');
  });
});
