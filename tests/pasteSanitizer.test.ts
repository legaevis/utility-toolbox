// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeHtml, sanitizePaste } from '../src/processors/pasteSanitizer';

describe('pasteSanitizer', () => {
  it('strips bold/italic/fonts/colors to plain text', () => {
    expect(sanitizeHtml('<p><b>bold</b> and <i style="color:red">red</i></p>')).toBe('bold and red');
  });

  it('keeps bullet lists', () => {
    expect(sanitizeHtml('<ul><li>one</li><li>two</li></ul>')).toBe('- one\n- two');
  });

  it('keeps numbered lists', () => {
    expect(sanitizeHtml('<ol><li>first</li><li>second</li></ol>')).toBe('1. first\n2. second');
  });

  it('keeps links clickable: labeled links become markdown, bare links stay bare', () => {
    expect(sanitizeHtml('<a href="https://ex.com">site</a>')).toBe('[site](https://ex.com)');
    expect(sanitizeHtml('<a href="https://ex.com">https://ex.com</a>')).toBe('https://ex.com');
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('x');
  });

  it('drops scripts and styles entirely', () => {
    expect(sanitizeHtml('<style>p{}</style><script>x()</script><p>ok</p>')).toBe('ok');
  });

  it('separates paragraphs with line breaks', () => {
    expect(sanitizeHtml('<p>a</p><p>b</p>')).toBe('a\nb');
  });

  it('falls back to plain text when no html is provided', () => {
    expect(sanitizePaste('  plain\r\ntext  ')).toBe('plain\ntext');
  });
});
