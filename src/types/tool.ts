import type { ComponentType } from 'react';

export type ToolCategory =
  | 'text'
  | 'lists'
  | 'formatting'
  | 'converters'
  | 'generators'
  | 'extractors'
  | 'time';

/** Declarative option schema — rendered automatically by OptionControl. */
export type OptionSpec =
  | {
      kind: 'toggle';
      id: string;
      /** i18n key suffix: tools.<toolId>.options.<id> */
      labelKey: string;
      default: boolean;
    }
  | {
      kind: 'select';
      id: string;
      labelKey: string;
      choices: { value: string; labelKey: string }[];
      default: string;
    }
  | {
      kind: 'text';
      id: string;
      labelKey: string;
      default: string;
      placeholderKey?: string;
    };

export type OptionValues = Record<string, boolean | string>;

export interface ProcessResult {
  output: string;
  /** Optional short status line, e.g. "5 matches replaced". i18n-formatted by the tool. */
  meta?: Record<string, number | string>;
}

export type Processor = (input: string, options: OptionValues) => ProcessResult;

export interface ToolDefinition {
  id: string;
  category: ToolCategory;
  /** No icons by design: tools are represented by their text names only. */
  /** Search keywords in both languages, lowercase. Names/descriptions from
   *  BOTH locales are also searched automatically — see registry/search.ts. */
  keywords: string[];
  /** Declarative options for GenericTextTool. */
  options?: OptionSpec[];
  /** Pure transform. Present for every generic text tool. */
  processor?: Processor;
  /** Action buttons for generic tools ("modes"), e.g. UPPERCASE / lowercase.
   *  Each mode calls the processor with { ...options, mode: value }. */
  modes?: { value: string; labelKey?: string; label?: string }[];
  /** If the tool needs a bespoke UI (counter, compare, daily report),
   *  it provides a component instead of / in addition to a processor. */
  component?: ComponentType;
  /** Live processing: re-run processor on every keystroke instead of a button. */
  live?: boolean;
  /** Generators don't take input — hides the input area in GenericTextTool. */
  noInput?: boolean;
  /** Future AI tools must set this; the shell will render an explicit
   *  "sends data to an external service" warning. Always false in MVP. */
  sendsDataExternally?: boolean;
}
