# Utility Toolbox

> Small tools for everyday digital tasks — all in one place.

Локальное, offline-first desktop-приложение (Electron + React + TypeScript +
Vite) для macOS и Windows: набор маленьких инструментов для работы с текстом,
списками и данными. Никаких аккаунтов, серверов, аналитики — весь текст
обрабатывается на устройстве.

## Скачать

Готовые сборки — на странице
**[Releases](https://github.com/legaevis/utility-toolbox/releases/latest)**:

- **macOS (Apple Silicon)** — `Utility-Toolbox-<версия>-mac-arm64.zip`. Распакуйте, перенесите в «Программы»; при первом запуске: правый клик → «Открыть» → «Открыть» (приложение не нотаризовано).
- **Windows 10/11 (x64)** — установщик `Utility-Toolbox-Setup-<версия>-win-x64.exe` или portable-версия одним файлом. SmartScreen при первом запуске: «Подробнее» → «Выполнить в любом случае» (сборка не подписана).

Контрольные суммы каждого релиза — в приложенном `SHA256SUMS.txt`.

## Структура папки

```
mac/             готовая сборка для macOS (Utility Toolbox.app)
windows/         готовая сборка для Windows (Setup .exe + portable .exe)
docs/            инструкции и документация проекта
src/, electron/  исходный код (общий для обеих платформ)
tests/           unit-тесты
build/           иконки приложения (.icns / .ico)
source/          исходные ассеты из Figma (иконки, app icon)
```

## Инструменты

| Категория | Инструменты |
| --- | --- |
| Закреплённые | **Типограф** (100 правил типографики + библиотека из 160 символов), **Daily Report** (локальные записи, отчёт за период, архив) |
| Текст | Case Converter, Keyboard Layout Switcher (RU↔EN), Text Cleaner, Character & Word Counter, Find & Replace, Transliteration, Words to Column, Spell Checker (офлайн) |
| Списки | Remove Duplicates, Sort List, Compare Lists, Merge Lines, Reverse List |
| Форматирование | Add Line Numbers, Replace Quotes, Tabs / Spaces, Insert Text |
| Конвертеры | Unit Converter (длина, вес, объём, температура, площадь, скорость, время) |
| Генераторы | Password, Random String, Random Words, Random Numbers, Placeholder Text, Email Generator |
| Извлечение | Extract from Text (emails / URLs) |
| Время и дата | World Clock, Time Zone Converter, Date & Time Formatter (офлайн, на Intl) |

Плюс: избранное, глобальный поиск (RU/EN), RU/EN интерфейс без перезапуска,
настройка «Регион и формат» (LocaleService на Intl API), светлая и тёмная темы,
оверлей-навигация по макету design 3.0, управление хранилищем.

## Запуск из исходников

Требуется Node.js 20+ (проверено на 22).

```bash
npm install        # один раз
npm run dev        # режим разработки (окно Electron + hot reload)
```

## Тесты и сборка

```bash
npm test             # unit-тесты всех processors (vitest)
npm run build        # typecheck + production-сборка renderer и main
npm run package:mac  # .dmg/.zip для macOS (запускать на macOS)
npm run package:win  # NSIS-установщик + portable .exe для Windows
```

## Документация

- [docs/DOCUMENTATION.md](./docs/DOCUMENTATION.md) — полная документация проекта: архитектура, контракты, дизайн-система, сборка.
- [docs/TYPOGRAPHY.md](./docs/TYPOGRAPHY.md) — движок Типографа: полный каталог всех 100 правил, конвейер, контракты идемпотентности.
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — краткий обзор архитектуры.

## Как добавить новый инструмент

1. Написать чистый processor в `src/processors/` (+ тест в `tests/`).
2. Создать `src/tools/<id>/definition.ts` с id, категорией, keywords и схемой опций.
3. Зарегистрировать definition в `src/registry/toolRegistry.ts`.
4. Добавить строки `tools.<id>.*` в `src/localization/locales/en.ts` и `ru.ts`.

Для типового инструмента «текст → текст» UI-код писать не нужно — его отрисует
`GenericTextTool`.
