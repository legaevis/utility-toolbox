/**
 * Safe URL recognition shared by Daily Report (and future tools).
 *
 * Splits text into segments so the UI can render real clickable links and
 * the clipboard code can build HTML. URLs are never modified — the href is
 * exactly what the user typed (only bare "www." gets an https:// prefix in
 * the href, while the visible label stays as typed).
 *
 * Supported:
 *   - bare URLs:      https://example.com/page?id=123&test=true
 *   - www URLs:       www.example.com
 *   - markdown links: [Макеты в Figma](https://figma.com/file/123)
 */

export type Segment =
  | { type: 'text'; text: string }
  | { type: 'link'; href: string; label: string };

const MD_LINK_RE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/gu;
const BARE_URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'）()\[\]{}]+/giu;

/** Trailing sentence punctuation is not part of the URL: "см. https://a.b." */
function splitTrailingPunctuation(url: string): { url: string; rest: string } {
  const m = url.match(/[.,;:!?…]+$/u);
  if (!m) return { url, rest: '' };
  return { url: url.slice(0, url.length - m[0].length), rest: m[0] };
}

function toHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function pushBareUrls(text: string, out: Segment[]): void {
  let last = 0;
  for (const m of text.matchAll(BARE_URL_RE)) {
    const index = m.index ?? 0;
    const { url, rest } = splitTrailingPunctuation(m[0]);
    if (url === '') continue;
    if (index > last) out.push({ type: 'text', text: text.slice(last, index) });
    out.push({ type: 'link', href: toHref(url), label: url });
    if (rest) out.push({ type: 'text', text: rest });
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
}

/** Parses one line (or a whole text) into text/link segments. */
export function linkify(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(MD_LINK_RE)) {
    const index = m.index ?? 0;
    if (index > last) pushBareUrls(text.slice(last, index), out);
    out.push({ type: 'link', href: m[2], label: m[1] });
    last = index + m[0].length;
  }
  if (last < text.length) pushBareUrls(text.slice(last), out);
  return out;
}

/** Plain-text rendering: bare URLs stay bare; labeled links keep both
 *  the label and the working URL: "Макет (https://…)". */
export function segmentsToPlain(segments: Segment[]): string {
  return segments
    .map((s) => {
      if (s.type === 'text') return s.text;
      return s.label === s.href ? s.href : `${s.label} (${s.href})`;
    })
    .join('');
}

export function linkifyToPlain(text: string): string {
  return segmentsToPlain(linkify(text));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** HTML rendering for the rich clipboard: real <a href> links. */
export function segmentsToHtml(segments: Segment[]): string {
  return segments
    .map((s) =>
      s.type === 'text'
        ? escapeHtml(s.text)
        : `<a href="${escapeHtml(s.href)}">${escapeHtml(s.label)}</a>`,
    )
    .join('');
}

export function linkifyToHtml(text: string): string {
  return segmentsToHtml(linkify(text));
}
