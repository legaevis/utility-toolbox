/**
 * Token protection for the Typograf engine.
 *
 * Before any rule runs, fragments that must NEVER be modified are replaced
 * with private-use placeholders and restored verbatim at the end:
 *   - fenced code blocks ``` … ``` and inline `code`
 *   - URLs (http/https/ftp/www.) and email addresses
 *   - HTML tags with all their attributes (text BETWEEN tags is processed)
 *   - HTML entities (&nbsp; &lt; …)
 *
 * This is what keeps quotes inside href="…", decimal points in versions
 * inside code, and phone-like numbers inside URLs completely untouched.
 */

const PLACEHOLDER = '\uE000';

export interface ProtectedText {
  text: string;
  tokens: string[];
}

const PROTECT_RE = new RegExp(
  [
    '```[\\s\\S]*?```', // fenced code blocks
    '`[^`\\n]*`', // inline code
    // A line that clearly IS code (JS/TS keywords) — protected whole (§22).
    '^[ \\t]*(?:const|let|var|function|import|export|return|if|for|while)\\b[^\\n]*$',
    '<[a-zA-Z!/][^>]*>', // HTML tags incl. attributes, closing and comments-ish
    '&[a-zA-Z]+;|&#\\d+;|&#x[0-9a-fA-F]+;', // HTML entities
    '(?:https?:\\/\\/|ftp:\\/\\/|www\\.)[^\\s<>"«»]+', // URLs
    "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", // emails
    // UUIDs (8-4-4-4-12) — the hyphens must never become dashes
    '\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\b',
    // hex hashes (git SHA, md5, …): 7–64 hex chars with BOTH a digit and a
    // letter — plain words and plain numbers never match
    '\\b(?=[0-9a-fA-F]*\\d)(?=[0-9a-fA-F]*[a-fA-F])[0-9a-fA-F]{7,64}\\b',
    // IPv4 addresses — dots must never become decimal commas
    '\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b',
    // CSS-style declaration: hyphenated latin property + value + ";" (§22)
    '\\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+[ \\t]*:[ \\t]*[^;\\n]{1,60};',
    // snake_case identifiers (user_id, MAX_VALUE …) — technical tokens (§22)
    '\\b\\w+_\\w+\\b',
  ].join('|'),
  'gm',
);

export function protect(text: string): ProtectedText {
  const tokens: string[] = [];
  const out = text.replace(PROTECT_RE, (m) => {
    tokens.push(m);
    return `${PLACEHOLDER}${tokens.length - 1}${PLACEHOLDER}`;
  });
  return { text: out, tokens };
}

export function restore(p: ProtectedText): string {
  return p.text.replace(
    new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, 'g'),
    (_, i) => p.tokens[Number(i)] ?? '',
  );
}
