# Utility Toolbox — Architecture

## Принцип

Это платформа, а не набор экранов. Три слоя с жёсткой границей:

1. **Processors** (`src/processors/`) — чистые функции `текст → текст` без единой зависимости от UI, React или Electron. Их легко тестировать (см. `tests/`), выносить в Web Worker и переносить на Windows/mobile без изменений.
2. **Tool definitions** (`src/tools/`) — декларативные описания: id, категория, keywords, схема опций, ссылка на processor. Регистрируются в едином реестре (`src/registry/toolRegistry.ts`).
3. **Shell** (`src/app/`, `src/components/`) — общий UI. `GenericTextTool` умеет отрисовать любой декларативный инструмент по его definition: Input → Options → Process → Output → Copy / Replace input.

Кастомный экран нужен только инструментам с особым UI: Character Counter (live-статистика), Compare Lists (два input, четыре результата), Find & Replace (поля Find/Replace + счётчик совпадений), Daily Report (хранит данные).

## Tool Registry

```ts
interface ToolDefinition {
  id: string;                 // 'case-converter' — также ключ локализации tools.<id>.*
  category: ToolCategory;     // 'text' | 'lists' | 'data' | 'productivity'
  icon: string;
  keywords: string[];         // en + ru, для поиска
  options?: OptionSpec[];     // toggle | select | text — рендерится автоматически
  modes?: { value: string }[];// кнопки-режимы (UPPERCASE, A→Z, ...)
  processor?: Processor;      // (input, options) => { output, meta? }
  component?: ComponentType;  // только для кастомных инструментов
  sendsDataExternally?: boolean; // для будущих AI-инструментов; в MVP всегда false
}
```

Поиск (`src/registry/search.ts`) идёт по id, keywords и по названиям/описаниям из **обоих** локалей, поэтому «раскладка» находит Keyboard Layout Switcher и в английском интерфейсе.

## Storage

Один адаптер `src/storage/storage.ts` поверх localStorage с namespace-ключами:

| Ключ | Данные | Чистится кнопкой |
| --- | --- | --- |
| `utb.settings` | настройки | только Reset |
| `utb.history` | id недавних инструментов | Clear History |
| `utb.favorites` | id избранных | только Reset |
| `utb.reports` | записи Daily Report | Clear Reports |
| `utb.cache.*` | временное состояние инструментов | Clear Cache |

Каждая кнопка в Settings → Storage удаляет строго свой префикс; Reset — всё с префиксом `utb.`. «Clear cache on quit» вешает обработчик `beforeunload` и трогает только `utb.cache.*`.

Если приложение перерастёт localStorage (лимит ~5 МБ), меняется только этот адаптер (например, на файлы через IPC) — потребители используют типизированные модули `settings.ts` / `history.ts` / `favorites.ts` / `reports.ts`.

## Localization

`I18nProvider` (React context) + `t('tools.case-converter.name')`. Локали — типизированные TS-объекты: `ru.ts` обязан повторять форму `en.ts` (`LocaleShape`), пропущенный перевод — ошибка компиляции. Смена языка — смена state, без перезапуска. Fallback: локаль → en → сам ключ, чтобы отсутствующий перевод никогда не ронял UI. Язык интерфейса нигде не участвует в обработке текста.

## Daily Report

- Записи `{ id, text, createdAt }` в `utb.reports`.
- Вставка форматированного текста проходит `pasteSanitizer`: HTML разбирается DOMParser-ом, стили/шрифты/цвета отбрасываются, маркированные списки становятся `- `, нумерованные — `1. `, ссылки сохраняются как `текст (url)`.
- Генерация отчёта — чистая функция `generateReport(entries, range, labels, formatDate)` в processors, покрыта тестами. Периоды: Today / Yesterday / This week (с понедельника) / Custom.

## Offline-first

- Ни одного `fetch` и ни одного внешнего CDN; шрифты системные.
- В production-сборку внедряется CSP `default-src 'self'` (см. `vite.config.ts`) — сеть заблокирована технически, а не по договорённости.
- Electron main не содержит сетевых модулей, `sandbox: true`, `contextIsolation: true`; внешние ссылки открываются только в системном браузере.
- Будущие AI-инструменты обязаны ставить `sendsDataExternally: true` — shell покажет явное предупреждение.

## Производительность и ошибки

Операции — нативный JS без тяжёлых библиотек; на текстах в единицы мегабайт выполняются мгновенно. Processors вызываются в try/catch — некорректный ввод не роняет приложение. Архитектурно тяжёлую операцию можно унести в Web Worker без изменения processor-а (он чистый).

## Портирование

- **Windows**: тот же код; в `package.json → build` добавить `win` target.
- **Mobile (будущее)**: слои processors + tools переносятся как есть; заменяется только shell.
