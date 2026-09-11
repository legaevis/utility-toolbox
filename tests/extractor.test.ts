import { describe, expect, it } from 'vitest';
import { extract, extractEmails, extractUrls } from '../src/processors/extractor';

describe('extractor', () => {
  it('extracts emails', () => {
    expect(extractEmails('Contact john@example.com or jane.doe+x@sub.example.org.')).toEqual([
      'john@example.com',
      'jane.doe+x@sub.example.org',
    ]);
  });

  it('extracts urls with and without scheme', () => {
    expect(extractUrls('see https://example.com/a?b=1 and www.test.ru.')).toEqual([
      'https://example.com/a?b=1',
      'www.test.ru',
    ]);
  });

  it('strips trailing sentence punctuation from urls', () => {
    expect(extractUrls('go to https://ex.com/page.')).toEqual(['https://ex.com/page']);
  });

  it('extracts both, emails first', () => {
    const out = extract('a@b.co and https://c.dev', 'both', true);
    expect(out).toEqual(['a@b.co', 'https://c.dev']);
  });

  it('dedupes case-insensitively when asked', () => {
    expect(extract('A@b.co a@B.co', 'emails', true)).toEqual(['A@b.co']);
    expect(extract('a@b.co a@b.co', 'emails', false)).toHaveLength(2);
  });

  it('returns empty list for text without matches or empty input', () => {
    expect(extract('просто текст', 'both', true)).toEqual([]);
    expect(extract('', 'both', true)).toEqual([]);
  });
});
