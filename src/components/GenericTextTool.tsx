import { useEffect, useMemo, useRef, useState } from 'react';
import type { OptionValues, ToolDefinition } from '../types/tool';
import { useI18n } from '../localization/i18n';
import { CopyButton } from './CopyButton';
import { OptionsPanel, optionDefaults } from './OptionControl';
import { readToolCache, writeToolCache } from '../storage/storage';

/**
 * Renders any declarative tool, laid out per the Figma mockups:
 *   [mode bar]  →  [options card (with Process/Generate inside)]
 *   →  input | output side by side  →  footer: Clear | Replace input + Copy.
 * A new generic tool needs zero UI code — just a definition + processor.
 */
export function GenericTextTool({ tool }: { tool: ToolDefinition }) {
  const { t } = useI18n();

  const cached = useMemo(
    () => readToolCache<{ input?: string; options?: OptionValues; mode?: string }>(tool.id, {}),
    [tool.id],
  );

  const [input, setInput] = useState(cached.input ?? '');
  const [options, setOptions] = useState<OptionValues>({
    ...optionDefaults(tool.options),
    ...(cached.options ?? {}),
  });
  const [activeMode, setActiveMode] = useState<string>(cached.mode ?? tool.modes?.[0]?.value ?? '');
  const [output, setOutput] = useState('');
  const [metaLine, setMetaLine] = useState('');
  // Contextual footer CTA (per the 39-1010 mockups): while the input/options
  // are newer than the last run the primary button is «Process»; after a run
  // it swaps to «Copy» until something changes again.
  const [dirty, setDirty] = useState(true);

  // Persist last input/options as disposable cache (cleared by Clear Cache).
  const persistTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      writeToolCache(tool.id, { input, options, mode: activeMode });
    }, 400);
    return () => window.clearTimeout(persistTimer.current);
  }, [tool.id, input, options, activeMode]);

  const run = (mode?: string) => {
    if (!tool.processor) return;
    const usedMode = mode ?? activeMode;
    setDirty(false);
    try {
      const result = tool.processor(input, { ...options, mode: usedMode });
      setOutput(result.output);
      if (result.meta) {
        const parts = Object.entries(result.meta).map(([key, value]) =>
          t(`tools.${tool.id}.meta.${key}`, { n: value }),
        );
        setMetaLine(parts.join(' · '));
      } else {
        setMetaLine('');
      }
    } catch {
      // A processor must never take the app down over odd input.
      setOutput('');
      setMetaLine('');
    }
  };

  // Live tools re-process on every change.
  useEffect(() => {
    if (tool.live) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, options, activeMode, tool.id]);

  const clearInput = () => {
    setInput('');
    setOutput('');
    setMetaLine('');
    setDirty(true);
  };

  const hasOptions = !!tool.options && tool.options.length > 0;
  // Footer CTA state: generators always offer Generate + Copy; live tools
  // only Copy; the rest swap Process ↔ Copy.
  const showProcess = !tool.live && !tool.noInput && (dirty || output === '');

  return (
    <div className="generic-tool">
      {tool.modes && (
        <div className="mode-bar">
          {tool.modes.map((m) => (
            <button
              key={m.value}
              className={activeMode === m.value ? 'mode-btn active' : 'mode-btn'}
              onClick={() => {
                setActiveMode(m.value);
                run(m.value);
              }}
            >
              {t(`tools.${tool.id}.modes.${m.value}`)}
            </button>
          ))}
        </div>
      )}

      {hasOptions && (
        <div className="options-card">
          <OptionsPanel
            toolId={tool.id}
            specs={tool.options!}
            values={options}
            onChange={(next) => {
              setOptions(next);
              setDirty(true);
            }}
          />
        </div>
      )}

      <div className={tool.noInput ? 'io-single' : 'io-grid'}>
        {!tool.noInput && (
          <div className="field-wrap">
            <textarea
              className="text-area"
              value={input}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => {
                setInput(e.target.value);
                setDirty(true);
              }}
              spellCheck={false}
            />
            <div className="field-copy">
              <CopyButton text={input} icon />
            </div>
          </div>
        )}
        <div className="field-wrap">
          <textarea
            className="text-area output"
            value={output}
            placeholder={t('common.emptyOutput')}
            readOnly
            spellCheck={false}
          />
          <div className="field-copy">
            <CopyButton text={output} icon />
          </div>
        </div>
      </div>
      {metaLine && <div className="meta-line">{metaLine}</div>}

      {/* Contextual footer (39-1010): Clear on the left; on the right the
          primary action for THIS task — Process until the result is fresh,
          then Copy. Generators keep Generate + Copy side by side. */}
      <div className="tool-footer">
        <div>
          {!tool.noInput && (
            <button className="btn btn-cta btn-secondary" onClick={clearInput} disabled={input === ''}>
              {t('common.clear')}
            </button>
          )}
        </div>
        <div className="tool-footer-right">
          {tool.noInput ? (
            <>
              <button className="btn btn-cta btn-primary" onClick={() => run()}>
                {t('common.generate')}
              </button>
              <CopyButton text={output} large />
            </>
          ) : showProcess ? (
            <button
              className="btn btn-cta btn-primary"
              onClick={() => run()}
              disabled={input === ''}
            >
              {t('common.process')}
            </button>
          ) : (
            <CopyButton text={output} large />
          )}
        </div>
      </div>
    </div>
  );
}
