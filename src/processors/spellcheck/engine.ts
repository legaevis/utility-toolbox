/**
 * Spell-check engine architecture.
 *
 * Decision for the MVP (documented so a future engine slots in cleanly):
 *
 * A quality offline spell checker needs real dictionaries. Bundling
 * Hunspell dictionaries (ru_RU + en_US ≈ 10+ MB) plus a WASM/JS engine
 * (e.g. typo-js / nspell) is a heavy dependency for an MVP — and Electron
 * ALREADY ships an offline spell checker: on macOS it uses the native
 * system NSSpellChecker (fully offline, supports every language enabled
 * in System Settings), on Windows/Linux it uses Chromium's Hunspell.
 *
 * So the MVP Spell Checker tool uses the platform's native engine via the
 * `spellcheck` attribute on an editable area: misspelled words get the
 * standard underline, right-click offers corrections. No text ever leaves
 * the device.
 *
 * When a custom engine is needed (batch checking, correction lists,
 * custom dictionaries), implement this interface and swap it into the
 * SpellChecker component — the UI does not depend on the engine.
 */

export interface SpellIssue {
  /** Offset of the misspelled word in the source text. */
  index: number;
  word: string;
  suggestions: string[];
}

export interface SpellEngine {
  /** ISO codes the engine can check, e.g. ['en', 'ru']. */
  languages(): string[];
  check(text: string, language: string): Promise<SpellIssue[]>;
}

/** Placeholder registry: the native (platform) engine handles checking
 *  inside editable areas; a custom engine can be registered later. */
let customEngine: SpellEngine | null = null;

export function registerSpellEngine(engine: SpellEngine): void {
  customEngine = engine;
}

export function getSpellEngine(): SpellEngine | null {
  return customEngine;
}
