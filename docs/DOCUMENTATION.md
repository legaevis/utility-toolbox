# Utility Toolbox — Complete Project Documentation

> Handoff document. Written so that any developer — human or AI — can pick up
> this project, understand every decision, and extend it without breaking its
> rules. Read this file before touching the code.

---

> Deep-dive docs: **TYPOGRAPHY.md** — the Typograf engine: the FULL catalog
> of all 100 typography rules (id, priority, language, examples, guards),
> the rules pipeline, idempotency contract, diff viewer and the
> 160-symbol panel. Typograf is PINNED in the sidebar (own nav item under
> Favorites) and opens full-width; it is excluded from the category tool
> list, while global search still finds it and routes to the pinned view.
> Every rule added to the app MUST be documented in that catalog.

## 1. What this product is

**Utility Toolbox** is a personal, offline-first desktop application (macOS
first) that bundles many small tools for everyday digital tasks: text
processing (incl. the Typograf typography engine), lists, formatting, unit
conversion, time & timezones, random-data generation, extraction, and a
Daily Report journal.

Product formula: *"Open the toolbox → find a small tool → solve the task →
copy the result → close the app."*

Core properties (non-negotiable):

- **Fast** — instant startup, instant operations, no heavy libraries.
- **Local / Private** — user text is NEVER sent anywhere. No accounts, no
  analytics, no cloud storage, no external APIs for core tools.
- **Offline-first** — everything works without internet. Enforced technically:
  a `default-src 'self'` CSP is injected into the production build
  (`vite.config.ts`), and no module performs network requests.
- **Simple / Useful** — every tool solves one small annoying task faster than
  googling a website for it. Don't add tools just to grow the catalog.
- **Modular** — adding a tool never requires rewriting existing ones.

If a future tool must send data externally (e.g. AI features), its
`ToolDefinition` must set `sendsDataExternally: true` and the shell must show
an explicit warning. No MVP tool does this.

## 2. Tech stack & commands

| Thing | Choice |
| --- | --- |
| Shell | Electron 33 (main process is minimal on purpose) |
| UI | React 18 + TypeScript (strict), plain CSS (single `styles.css`, CSS variables) |
| Bundler | Vite 6 (renderer), esbuild (Electron main/preload) |
| Tests | Vitest (`tests/*.test.ts`; jsdom only where DOM is needed) |
| Packaging | electron-builder (proper .dmg on macOS) / @electron/packager (cross-builds) |

```bash
npm install          # once
npm run dev          # Electron window + Vite HMR (renderer on :5173)
npm test             # vitest run — all processor tests
npm run build        # tsc --noEmit + vite build (dist/) + esbuild main (dist-electron/)
npm run package:mac  # electron-builder .dmg/.zip — must run ON macOS
```

Node 20+ required. There is **no backend, no server code, no database**.

## 3. Repository layout

```
electron/
  main.ts            # window, CSP-friendly link handling, spellcheck langs
  preload.ts         # minimal contextBridge (no IPC surface yet — by design)
index.html           # entry; CSP is injected at build time, not here
src/
  app/               # application shell
    main.tsx         # ReactDOM entry
    App.tsx          # 3-pane layout, top-level state, providers
    Sidebar.tsx      # left rail: categories only (+Favorites, Settings)
    ToolListColumn.tsx # middle column: search + tool cards of active section
    SettingsView.tsx # settings screen (rendered in the content pane)
    styles.css       # ENTIRE design system (see §11)
  components/        # shared UI building blocks
    ToolShell.tsx    # content-pane wrapper: toolbar (name, star chip) + body
    GenericTextTool.tsx # renders ANY declarative tool (see §5)
    OptionControl.tsx   # renders OptionSpec[] (toggle/select/text)
    CopyButton.tsx   # plain + rich (text/html) clipboard copy
    LinkifiedText.tsx# renders text with real clickable <a> links
    ConfirmDialog.tsx
    icons.tsx        # inline 16px lucide-style SVGs (star/folder/search/gear/circle-x)
  processors/        # PURE business logic — the most important layer
    caseConverter.ts layoutSwitcher.ts textCleaner.ts counter.ts
    removeDuplicates.ts sortList.ts compareLists.ts findReplace.ts
    typography.ts    # legacy formatter; exports protect()/restore() used by replaceQuotes
    typograf/        # the Typograf engine: engine.ts rules.ts protect.ts
                     #   detect.ts symbols.ts (see TYPOGRAPHY.md)
    transliteration.ts extractor.ts linkify.ts reportGenerator.ts
    pasteSanitizer.ts listFormatting.ts replaceQuotes.ts encoding.ts
    generators.ts unitConverter.ts timezones.ts lines.ts
    spellcheck/engine.ts  # SpellEngine interface stub (see §13)
  tools/             # one folder per tool: definition.ts (+ Component.tsx if custom UI)
  registry/
    toolRegistry.ts  # THE tool list + category order
    search.ts        # bilingual global search
  localization/
    i18n.tsx         # I18nProvider + t(); locale fallback chain
    locales/en.ts    # canonical locale (defines LocaleShape type)
    locales/ru.ts    # typed against en — missing key = compile error
    localeService.ts # LocaleService: ALL number/date/time/timezone formatting
    LocaleContext.tsx# React access to LocaleService (global region)
  storage/           # localStorage adapter + typed modules (see §9)
  types/tool.ts      # ToolDefinition, OptionSpec, Processor contracts
tests/               # one test file per processor
```

## 4. Architecture — three layers, strict boundaries

```
processors (pure TS)  →  tool definitions (declarative)  →  shell (React UI)
```

1. **Processors** contain all business logic as pure functions. They import
   nothing from React, Electron, or storage. This makes them unit-testable,
   portable (future Windows/mobile builds reuse them as-is), and safe to move
   into a Web Worker if a heavy operation ever appears.
2. **Tool definitions** (`src/tools/<id>/definition.ts`) declare what a tool
   is: id, category, bilingual keywords, option schema, modes, and a reference
   to its processor (or a custom component).
3. **Shell** renders everything. `GenericTextTool` can render any declarative
   tool with zero tool-specific UI code.

Rule of thumb: **if you are writing string-manipulation code inside a .tsx
file, you are doing it wrong** — move it to a processor and test it.

## 5. The tool contract (`src/types/tool.ts`)

```ts
interface ToolDefinition {
  id: string;                // kebab-case; ALSO the i18n key: tools.<id>.*
  category: ToolCategory;    // 'text'|'lists'|'formatting'|'converters'|
                             // 'encoding'|'generators'|'extractors'|'time'|'productivity'
  keywords: string[];        // lowercase, English AND Russian, for search
  options?: OptionSpec[];    // declarative options → OptionControl renders them
  modes?: { value: string }[]; // action buttons (UPPERCASE / A→Z / Encode …)
  processor?: Processor;     // (input, options) => { output, meta? }
  component?: ComponentType; // ONLY for tools needing bespoke UI
  live?: boolean;            // re-run processor on each keystroke
  noInput?: boolean;         // generators: hide input area, button says "Generate"
  sendsDataExternally?: boolean; // future AI tools MUST set true
}
```

`OptionSpec` kinds: `toggle` (checkbox), `select` (choices with labelKeys),
`text` (free input — also used for numbers; processors parse and clamp).

**GenericTextTool behavior** (`src/components/GenericTextTool.tsx`):
Input textarea → OptionsPanel → mode buttons (or a single Process/Generate
button) → readonly output → Copy + Replace-input. When a mode button is
clicked the processor gets `{ ...options, mode }`. `result.meta` entries are
rendered via i18n keys `tools.<id>.meta.<key>` with `{n}` substitution.
Last input/options are cached per tool in `utb.cache.<id>` (debounced 400ms).
Processor calls are wrapped in try/catch — bad input must never crash the app.

**Per-tool help**: every tool MUST have `tools.<id>.help` in BOTH locales —
a few sentences (paragraphs separated by \n): what the tool does, how to use
it, notable caveats. Shown by the "?" chip in the tool toolbar (HelpDialog in
`ToolShell.tsx`). Adding a tool without help text is a compile error (locale
shape).

**Tool archiving**: the archive chip in the tool toolbar (next to the star)
hides a tool from the tool list column — categories, favorites AND search
(`utb.archivedTools`, `storage/archivedTools.ts`). Archived tools are listed
in the Archive panel with a Restore button; an open archived tool shows a
banner with a restore link. Cleared only by Reset Application.

**Custom-UI tools** (have `component`): character-counter, compare-lists,
find-replace, daily-report, spell-checker, unit-converter, world-clock,
timezone-converter, datetime-formatter. Everything else is declarative.

### How to add a new tool (checklist)

1. Write a pure processor in `src/processors/` + tests in `tests/`.
2. Create `src/tools/<id>/definition.ts` (id, category, keywords, options/modes).
3. Register it in `src/registry/toolRegistry.ts` (import + add to `TOOLS`).
4. Add `tools.<id>.{name,description,...}` to `locales/en.ts` AND `locales/ru.ts`
   (TypeScript enforces the ru shape).
5. `npm test && npm run build`. Done — search, sidebar, favorites, caching all
   work automatically.

## 6. Registry & search

`TOOLS` array in `toolRegistry.ts` is the single source of truth (34 tools).
`searchTools(query)` (`registry/search.ts`) scores matches against: tool id,
keywords, and **names + descriptions from BOTH locales** — so «раскладка»
finds Keyboard Layout Switcher even in the English UI. Search results ignore
sidebar visibility — hidden categories stay reachable.

## 7. Localization (UI language)

- `I18nProvider` + `t('path.to.key', {n: 5})`. Two locales: `en`, `ru`.
- `en.ts` is canonical; `ru.ts` is typed `LocaleShape` — a missing translation
  is a **compile error**. Never hardcode UI strings in components.
- Fallback chain: current locale → en → the raw key (never crash).
- Switching language re-renders live, no restart.
- **App language ≠ text language ≠ region format.** UI language never affects
  text processing, and is independent from Region & Format (§8).

## 8. LocaleService (Region & Format)

`src/localization/localeService.ts` is the ONLY formatting layer for numbers,
dates, times, timezones. Built entirely on `Intl` (NumberFormat,
DateTimeFormat, RelativeTimeFormat, supportedValuesOf('timeZone')) — offline,
zero dependencies. **Never format numbers/dates inline in a tool.**

- Regions: `auto` (system), `ru`, `us`, `uk`, `de`, `fr`, `jp`,
  `custom` (free BCP-47 tag). Global default lives in Settings → Region &
  Format; tools may offer a local override (Unit Converter does).
- Exact value and presentation are strictly separated: computation always uses
  precise numbers/epochs; formatting is applied only at display time.
- Timezone math is in `src/processors/timezones.ts`: `tzOffsetMs` derives the
  offset from `Intl.formatToParts`, `wallTimeToEpoch` uses two-pass estimation
  (handles DST). No timezone libraries — platform IANA data only.
- React access: `useLocale()` from `LocaleContext.tsx`.

## 9. Storage (all local, namespaced)

Single adapter `src/storage/storage.ts` over `localStorage`. Namespaces are
what make the Settings → Storage buttons independent and safe:

| Key | Contents | Cleared by |
| --- | --- | --- |
| `utb.settings` | AppSettings (see below) | Reset only |
| `utb.history` | recently used tool ids (internal, NOT shown in UI) | Clear History |
| `utb.favorites` | favorite tool ids | Reset only |
| `utb.reports` | Daily Report entries `{id, text, createdAt}` | Clear Reports |
| `utb.worldclock` | World Clock city list | Reset only |
| `utb.archivedTools` | archived (hidden) tool ids | Reset only |
| `utb.typograf` | Typograf rule settings (language/live/categories) | Reset only |
| `utb.symbolFavorites` | Typograf starred symbols | Reset only |
| `utb.cache.*` | disposable per-tool state (last input/options) | Clear Cache |

Each button clears exactly its prefix; **Reset Application** removes every
`utb.*` key. Every destructive action has a ConfirmDialog. "Clear cache on
quit" (beforeunload) touches only `utb.cache.*`. If the app outgrows
localStorage (~5MB), only `storage.ts` changes (e.g. to file-based via IPC).

`AppSettings` (`storage/settings.ts`): `language`, `saveHistory`,
`clearCacheOnQuit`, `region`, `customLocale`, `sidebarOrder: ToolCategory[]`,
`sidebarEnabled: Record<ToolCategory, boolean>`. `loadSettings()` deep-merges
stored values with defaults so app updates that add categories/keys never
break existing installs.

## 10. Layout & navigation (current design)

- **Pinned sections**: Typograf (IconType) and Daily Report (IconReport) sit
  right under Favorites. Each opens as a panel with its OWN middle column of
  sub-views (`PinnedNavColumn` in App.tsx): Typograf → Text/Symbols, Daily
  Report → Report/Archive (the report-entries archive). ToolShell runs in
  `pinned` mode — only the Help chip (no star/archive). Both tools are
  excluded from category lists; search finds them and routes to the panel
  (`PINNED_TOOL_IDS`). The former Productivity category was removed (its
  only tool, daily-report, is now pinned; stored settings are sanitized in
  loadSettings). The global Archive panel now holds archived TOOLS only —
  report entries live in Daily Report → Archive (ReportArchive.tsx).
- **Switches**: every `input[type='checkbox']` app-wide renders as an
  iOS-style toggle (global CSS, `--switch-off` token per theme).
- **Overlay navigation (design 3.0, node 88-13145)**: the content takes the
  WHOLE window; there are no persistent columns. A toggle button
  (`.nav-toggle-btn`, fixed top-left; on macOS it sits BELOW the traffic
  lights — they must never overlap it) opens `.nav-overlay` OVER the
  content: [Sidebar | flyout column]. The flyout is the tool list of the
  active section (`ToolListColumn`, with search) or the pinned section's
  sub-views (`PinnedNavColumn`). Picking a tool/sub-view closes the
  overlay; backdrop click, Esc and the toggle close it too. Archive /
  Help / Settings close it immediately (they render full-width). The
  overlay uses the liquid-glass blur (`--glass-bg` + backdrop-filter);
  on macOS the window itself has vibrancy (`electron/main.ts`) and the
  big background layers go translucent (`:root.is-mac` tokens). A fresh
  launch starts with the overlay open. Below 820px `.io-grid` stacks to
  one column.

Overlay panels (same components as before, now inside `.nav-overlay`):

1. **Sidebar, 224px** (`Sidebar.tsx`): brand "Utility Toolbox", pinned
   **Favorites**/**Typograf**/**Daily Report**, "TOOLS" label, then category
   items — driven by `sidebarOrder`/`sidebarEnabled` from Settings; at the
   bottom: **Archive** (`ArchiveView.tsx`), **Help** (`InfoView.tsx`) and
   **Settings**. Categories only — never individual tools.
2. **Flyout column, 274px** (`ToolListColumn.tsx`): search field on top;
   below, tool cards (name + short description) of the active section.
   Active card/nav pill = solid `--accent`. Search results span ALL tools.
3. **Content pane (full window)**: `ToolShell` toolbar (toggle clearance
   68px left padding, tool name 18px bold, round chips) and the tool body.
   Settings render here too. No tool selected → centered empty state.

Sidebar customization: Settings → Sidebar (per-category checkbox + ↑/↓
reorder, persisted). Default visible: text, lists, converters, time,
productivity. Hiding a category never deletes tools. Tool-level visibility is
a planned future extension of the same mechanism.

## 11. Design system (all in `src/app/styles.css`)

**Committed LIGHT theme** («design 3.0», Figma node 88-13145) — a single
palette, no theme switcher. All tokens live in `:root` in styles.css.
Font: Inter with system fallback (NOT loaded from the web — offline rule).

| Token | Value | Use |
| --- | --- | --- |
| `--bg` / `--bg-sidebar` / `--bg-content` | `#ffffff` | window, left rail, content pane |
| `--bg-list` | `#fafbfc` | middle column |
| `--bg-panel` | `#fbfbfc` | panels, group cards, textareas |
| `--bg-elevated` | `#f2f3f5` | inputs, chips, secondary buttons, search pill |
| `--border` | `#e8eaee` | all borders |
| `--text` / `--text-secondary` / `--text-muted` | `#1e1f24` / `#6f7480` / `#9aa0aa` | text hierarchy |
| `--accent` | `#7c9cf4` | soft periwinkle: primary buttons, links, active nav pill, active modes |
| `--pill-bg` | `#17181c` | dark pill button (Add entry style) |
| `--danger` / `--star` | `#e5484d` / `#f7b500` | delete icons / favorite star |
| `--shadow-card` / `--shadow-pop` | subtle | cards / dialogs, popovers |
| radii | 8 / 10 / 12 / 16 / 20 / pill 30–50 | sidebar items / active pill / inputs / cards / sections / buttons |

Component classes: `.btn` (pill, elevated), `.btn-primary` (blue),
`.btn-dark` (black pill), `.btn-cta` (large blue pill), `.btn-mode`
(chips, `.active` = blue), `.btn-link` (blue text link), `.btn-ghost`,
`.icon-btn` (red circle-x), `.chip-btn` (round icon chip).

**Icons**: the EXACT SVG assets the user exported from Figma
(`<project>/source/*.svg`), inlined in `components/icons.tsx` with
`currentColor` strokes: star, folder, archive, help, settings, circle-x
(+ a search glyph). No emoji, no icon fonts, no decorative pictograms, no
icons glued to tool names. The app icon (`source/app icon.png`) is converted
to `build/icon.icns` (used by electron-builder config and --icon in
electron-packager).

**Generic tool layout (per the case-converter/text-cleaner mockups)**:
mode bar (`.mode-bar`, pill container; active mode = accent pill) → options
card (`.options-card`, with the Process/Generate button inside when the tool
has no modes) → input | output side by side (`.io-grid`; `.io-single` for
noInput generators) → full-bleed footer (`.tool-footer`): Clear left,
Replace input + Copy (accent, `.btn-cta` 56px pills) right. The content pane
has the mockup's top gradient: `--gradient-from` → `--bg-content` over
~640px, painted on `.content`.

## 12. Daily Report subsystem (most product-specific part)

Behavior contract (explicit user requirements — do not regress):

- Entries: `{id, text, createdAt}` in `utb.reports`; added via textarea
  (⌘Enter/Ctrl+Enter), listed grouped by day with time stamps; Edit (blue
  link) and delete (circle-x, with confirm) per row.
- Periods: Today / Yesterday / This week (Monday-based) / Custom date range.
- **Generated report = the entries only.** No title, no date header, no
  comments. `generateReportText(entries)` → `• line` bullets, multi-line
  entries indented.
- **Links must be truly clickable everywhere**:
  - `processors/linkify.ts` parses bare URLs, `www.` links, and markdown
    `[label](url)`; URLs are never modified (only `https://` prefix for the
    href of `www.` links; trailing sentence punctuation excluded).
  - Entry list and report view render via `LinkifiedText` → real `<a>`;
    Electron opens them in the system browser (window-open + will-navigate
    handlers in `electron/main.ts`).
  - **Copy** uses the rich clipboard: `text/html` (a `<ul>` with real
    `<a href>`) + `text/plain` fallback where bare URLs stay bare and
    labeled links become `label (url)`. See `CopyButton` (`html` prop) and
    `generateReportHtml`.
- Pasting rich text (`pasteSanitizer.ts`, DOMParser): strips bold/italic/
  fonts/colors/styles; keeps plain text, bullet lists (`- `), numbered lists
  (`1. `), and links — labeled `<a>` becomes markdown `[label](url)` so the
  URL survives and stays clickable; `javascript:` hrefs are dropped.

## 13. Electron main process (`electron/main.ts`)

Deliberately minimal (~80 lines). Security posture: `contextIsolation: true`,
`sandbox: true`, `nodeIntegration: false`; external links never navigate the
app window (`setWindowOpenHandler` + `will-navigate` → `shell.openExternal`);
no networking modules at all. Spellcheck: on macOS Electron uses the native
system spellchecker automatically (offline); on Windows/Linux
`setSpellCheckerLanguages(['en-US','ru'])` is set. The Spell Checker tool is a
spellcheck-enabled textarea + a documented `SpellEngine` interface stub
(`processors/spellcheck/engine.ts`) for a future batch engine — deliberately
NO bundled Hunspell dictionaries (≈10MB) in the MVP.

## 14. Testing

- Every processor has a test file in `tests/` (21 files, 333 tests).
- Typograf alone has 160 tests (`tests/typograf.test.ts`): reference cases
  §39, the mandatory scenario §29, the English etalon sample (v0.15.0),
  protection, idempotency (plain + aggressive), rule metadata, symbols.
- Conventions: cover empty input, Cyrillic, Latin, mixed, Unicode/emoji,
  punctuation, URLs, multiline, and round-trips where applicable.
- DOM-dependent tests (pasteSanitizer) use `// @vitest-environment jsdom`.
- Timezone tests rely on Node's full ICU (Node 20+ ships it).
- Run `npm test` and `npm run build` (includes `tsc --noEmit`) before any
  delivery. Playwright is available as a dev dependency for browser smoke
  tests against `vite preview` (see `smoke*.mjs` history in git if kept).

## 15. Build & packaging

- `npm run build` → `dist/` (renderer with injected offline CSP) +
  `dist-electron/` (main.cjs, preload.cjs).
- **Proper distributable**: `npm run package:mac` on a Mac (electron-builder,
  .dmg + .zip, config in `package.json → build`).
- **Cross-packaging from Linux** (what was used during development):
  `@electron/packager --platform=darwin --arch=arm64` then ad-hoc signing with
  `rcodesign` (apple-platform-rs). Caveats: signature is ad-hoc → first launch
  needs right-click → Open; transfer must preserve symlinks and exec bits
  (tar, not naive copy). This path is a convenience, not the release process.
- **Windows port (prepared)**: `npm run package:win` (electron-builder,
  nsis + portable targets, `build/icon.ico` generated from the icns).
  `main.ts` is already platform-branched (titleBarStyle hiddenInset only on
  darwin; explicit Hunspell languages off-macOS; quit on window-all-closed
  off-macOS). Processors/tools/shell are platform-agnostic; body font stack
  includes Segoe UI. Actual .exe builds should run on Windows or under wine.

## 16. Decision log (why things are the way they are)

| Decision | Reason |
| --- | --- |
| Plain CSS + variables, no Tailwind/design-system lib | tiny, fast, no lock-in; the mockup maps 1:1 to tokens |
| localStorage over SQLite/files | MVP data is tiny; adapter isolates the swap if ever needed |
| Bilingual keywords + cross-locale search | RU user with EN UI must still find «раскладка» |
| `en.ts` as canonical typed locale | missing translations become compile errors |
| Processors never format numbers/dates | Region & Format must apply consistently (LocaleService only) |
| Report has no title | explicit user requirement (report = entries only) |
| Links stored as markdown after rich paste | survives plain-text storage AND stays clickable |
| Unit conversion via base units, exact factors | presentation (locale, ft+in) is a separate layer |
| Timezones via Intl only | offline requirement; no tz database dependency |
| Light-only theme (design 3.0) | the 88-13145 mockup defines a committed light look; no switcher |
| No Recent section in UI | explicit user requirement; history kept internally for Clear History |
| Electron main minimal, no IPC yet | smaller attack surface; renderer is self-sufficient |

## 17. Known limitations / next steps

- Spell Checker underlines + right-click suggestions only (native engine);
  batch error list needs a dictionary engine behind `SpellEngine`.
- `package:mac` (proper signed .dmg) has to run on macOS; no Apple Developer
  certificate is configured (ad-hoc only so far).
- Dark theme dropped with the design-3.0 redesign; reintroduce only as a
  full token set if the design defines one.
- Deferred tools (candidates, keep the bar of §1): Format Numbers, extra
  extractors (hashtags, mentions, numbers), tool-level sidebar visibility,
  showing usage history inside Settings, Web Worker offloading for huge texts.
- Figma asset URLs expire (~7 days); icons are therefore inlined in
  `icons.tsx`, not fetched.

## 18. Acceptance criteria snapshot (all currently met)

Runs on macOS offline; 30 tools across 7 categories (plus pinned Typograf —
100 typography rules, see TYPOGRAPHY.md — and Daily Report) work locally; RU/EN UI
switch without restart; Region & Format affects all formatting via
LocaleService; sidebar categories toggle/reorder and persist; favorites;
bilingual search; Daily Report stores entries locally, generates entry-only
reports with clickable links and rich-clipboard copy; Storage screen clears
cache/history/reports independently and Reset wipes everything (with
confirmations); 333 unit tests green; `npm run build` clean; adding a tool
touches only: processor + definition + registry + two locale files.
