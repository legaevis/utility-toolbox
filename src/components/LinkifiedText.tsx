import { Fragment } from 'react';
import { linkify } from '../processors/linkify';

/**
 * Renders text with real clickable links. Bare URLs and markdown links
 * [label](url) become <a> elements; in Electron they open in the system
 * browser (window-open handler in the main process), in a plain browser —
 * in a new tab.
 */
export function LinkifiedText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {linkify(line).map((seg, j) =>
            seg.type === 'text' ? (
              <Fragment key={j}>{seg.text}</Fragment>
            ) : (
              <a key={j} href={seg.href} target="_blank" rel="noopener noreferrer">
                {seg.label}
              </a>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}
