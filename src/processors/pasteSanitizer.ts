/**
 * Cleans pasted rich text for Daily Report entries.
 *
 * Keeps: plain text, bullet lists (as "- "), numbered lists (as "1. "), URLs.
 * Drops: bold/italic/fonts/colors and every other visual style.
 *
 * Uses DOMParser (available in the renderer). Falls back to the plain-text
 * input when no HTML is provided.
 */

function nodeToText(node: Node, listStack: ('ul' | 'ol')[], counters: number[]): string {
  if (node.nodeType === Node.TEXT_NODE) {
    // Collapse whitespace the way HTML rendering does.
    return (node.textContent ?? '').replace(/\s+/g, ' ');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (tag === 'script' || tag === 'style' || tag === 'head') return '';

  if (tag === 'br') return '\n';

  if (tag === 'a') {
    const href = el.getAttribute('href') ?? '';
    const text = childrenToText(el, listStack, counters).trim();
    if (!href || !/^https?:\/\//i.test(href)) return text;
    // Keep the link CLICKABLE: if the visible text is the URL itself, keep the
    // bare URL; otherwise store a markdown link, which the app renders as a
    // real link and never loses the URL.
    if (text === href || text === '') return href;
    return `[${text.replace(/[\[\]]/g, '')}](${href})`;
  }

  if (tag === 'ul' || tag === 'ol') {
    listStack.push(tag);
    counters.push(0);
    const inner = childrenToText(el, listStack, counters);
    listStack.pop();
    counters.pop();
    return '\n' + inner;
  }

  if (tag === 'li') {
    const depth = Math.max(0, listStack.length - 1);
    const indent = '  '.repeat(depth);
    let marker = '- ';
    if (listStack[listStack.length - 1] === 'ol') {
      counters[counters.length - 1]++;
      marker = `${counters[counters.length - 1]}. `;
    }
    const inner = childrenToText(el, listStack, counters).trim();
    return `${indent}${marker}${inner}\n`;
  }

  const BLOCK = ['p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'blockquote', 'pre'];
  const inner = childrenToText(el, listStack, counters);
  if (BLOCK.includes(tag)) return inner.trim() === '' ? '' : inner.trim() + '\n';
  return inner; // spans, b, i, em, strong, font … — text only, styles dropped
}

function childrenToText(el: Node, listStack: ('ul' | 'ol')[], counters: number[]): string {
  let out = '';
  el.childNodes.forEach((child) => {
    out += nodeToText(child, listStack, counters);
  });
  return out;
}

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const raw = childrenToText(doc.body, [], []);
  return raw
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Entry point for paste events: prefers HTML when present. */
export function sanitizePaste(plain: string, html?: string): string {
  if (html && html.trim() !== '') {
    try {
      return sanitizeHtml(html);
    } catch {
      /* fall through to plain */
    }
  }
  return plain.replace(/\r\n|\r/g, '\n').trim();
}
