# Реестр компонентов ConfCall Scheduler

Теги: `#frontend` `#angular` `#components` `#ui` `#reuse` `#agents`

Документ помогает быстро понять, какие UI-компоненты уже есть в проекте, что можно переиспользовать, а что пока является feature-specific реализацией.

Для AI-агентов: перед созданием нового UI прочитать [AI_ONBOARDING.md](./AI_ONBOARDING.md) и этот файл. Если нужный паттерн уже есть, переиспользовать его. Если добавлен новый reusable-компонент или изменено правило использования существующего, обновить этот реестр.

## Правила

- Новые общие controls добавлять в `frontend/src/app/shared/components/`.
- Селектор компонента должен начинаться с `ccs-`.
- Если один и тот же UI-паттерн нужен в двух местах, выносить его в shared до третьей копии.
- Для модальных окон использовать `ccs-modal-shell`; не создавать локальные `.dialog-header`, `.dialog-close`, shell-card и shadow-стили.
- Для дат использовать `ccs-date-input`, если нужен стилизованный календарь в стиле приложения.
- Для выбора времени использовать `ccs-time-select`, а не нативный `input[type="time"]`, если важны единый стиль и контролируемая выпадашка.
- Для небольших overlay/listbox меню использовать нативный scroll + CSS `scrollbar-color`/`scrollbar-width`/`::-webkit-scrollbar`. Отдельную scrollbar-библиотеку подключать только если появится сложный scroll-container с виртуализацией, синхронизацией скролла или кроссбраузерными требованиями, которые нельзя закрыть CSS.
- Transient UI очищается при смене маршрута: CDK Dialog закрываются в `AppComponent`, toast-очередь очищается через `ToastService.clear()`. Не создавать самостоятельные глобальные overlay, которые переживают навигацию.
- Для feature-страниц сначала упрощать сценарий и убирать дублирующие блоки. Новый shared-компонент добавлять только если паттерн нужен повторно или уже явно стал общим.

## Shared Components

| Компонент                    | Путь                                                       | Назначение                                                                                                                           | Статус                        |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `ccs-navbar`                 | `frontend/src/app/shared/components/navbar/`               | Основная навигация приложения, бейдж новых встреч, account menu                                                                      | Переиспользуемый layout       |
| `ccs-dropdown`               | `frontend/src/app/shared/components/dropdown/`             | Выпадающее меню с закрытием по outside click, Escape и focusout                                                                      | Переиспользуемый              |
| `svg-icon`                   | `frontend/src/app/shared/components/icon/`                 | Единый SVG icon renderer с реестром иконок                                                                                           | Переиспользуемый              |
| `ccs-modal-shell`            | `frontend/src/app/shared/components/modal-shell/`          | Общий каркас модалок: header, eyebrow, subtitle, close, header actions, body, footer                                                 | Обязателен для модалок        |
| `ccs-modal-dialog`           | `frontend/src/app/shared/components/modal/`                | Простые `info/error/confirm/choose` через `ModalService`                                                                             | Переиспользуемый              |
| `ccs-tooltip` + `ccsTooltip` | `frontend/src/app/shared/components/tooltip/`              | Tooltip через CDK Overlay, единый z-index и стиль                                                                                    | Переиспользуемый              |
| `ccs-toast-host`             | `frontend/src/app/shared/components/toast/`                | Очередь тостов с приоритетами в нижнем правом углу; очищается при навигации                                                          | Переиспользуемый              |
| `ccs-date-input`             | `frontend/src/app/shared/components/date-input/`           | Date ControlValueAccessor на flatpickr, общий календарь `confcall-datepicker`, поддержка `minDate`, `describedBy` и `availableDates` | Переиспользуемый form control |
| `ccs-time-select`            | `frontend/src/app/shared/components/time-select/`          | Time ControlValueAccessor на CDK Overlay, стилизованный список времени                                                               | Переиспользуемый form control |
| `ccs-selectable-card-grid`   | `frontend/src/app/shared/components/selectable-card-grid/` | Компактные карточки выбора с avatar/fallback и selected-состоянием для групп и участников                                            | Переиспользуемый              |

## Feature Components

| Компонент                       | Путь                                                          | Назначение                                                                                                           | Возможность переиспользования                     |
| ------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `ccs-user-select`               | `features/book/components/user-select/`                       | Обёртка выбора участников группы над `ccs-selectable-card-grid`                                                      | Feature-specific mapping `UserWithAvailability`   |
| `ccs-booking-dialog`            | `features/book/components/booking-dialog/`                    | Общий диалог для создания внутренней встречи и публичной ссылки бронирования с единым контекстом группы и участников | Feature-specific, использует `ccs-modal-shell`    |
| `ccs-availability-event-dialog` | `features/availability/components/availability-event-dialog/` | Создание/редактирование слота доступности                                                                            | Feature-specific, использует shared form controls |
| `ccs-meeting-details-dialog`    | `features/availability/components/meeting-details-dialog/`    | Просмотр деталей встречи из календаря доступности                                                                    | Можно переиспользовать на странице встреч         |

## Потенциальные Выносы

| Паттерн                    | Где сейчас                                    | Что сделать при повторном использовании                                                                                   |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Segmented control          | `availability-event-dialog`, фильтры встреч   | Вынести `ccs-segmented-control` с roving tabindex и ARIA tabs/radio semantics                                             |
| Listbox select             | `ccs-time-select`, duration select на `/book` | Обобщить в `ccs-select` поверх CDK Overlay                                                                                |
| Empty/error/loading states | Несколько страниц                             | Вынести `ccs-state` с вариантами `empty`, `error`, `loading`                                                              |
| User/member cards          | `/book`, `/groups`, `/meetings`               | Вынести компактный `ccs-person-chip` или `ccs-user-card`                                                                  |
| Public link rows           | `/booking-links`                              | Если появятся в другом разделе, вынести `ccs-link-row`: кликабельный URL, status chip и icon-actions с tooltip/aria-label |
| Calendar month grid        | `/availability`                               | Вынести после стабилизации API доступности и keyboard-сценариев                                                           |

## Datepicker Решение

Сейчас проект использует `flatpickr` внутри `ccs-date-input`. Причины оставить его:

- уже есть интеграция с ручным вводом, `ControlValueAccessor` и темой `confcall-datepicker`;
- flatpickr поддерживает `allowInput`, `disableMobile`, `positionElement`, `prevArrow/nextArrow`, `ariaDateFormat` и `monthSelectorType`;
- Angular Material Datepicker потребовал бы подключения Material theme/adapter и принёс бы чужую visual system;
- известные DOM-шероховатости flatpickr, например отсутствие `id/name` у month dropdown, патчатся централизованно в `ccs-date-input`.
- `ccs-date-input` поддерживает `availableDates`: дни из списка получают общий класс подсветки `ccs-flatpickr-day--available`. Использовать этот вход для публичного бронирования, `/book` и других сценариев, где нужно подсветить доступные даты, а не дублировать стили flatpickr в feature-компоненте. На `/book` список дат должен приходить из одного range-запроса intersection: один участник — его свободные дни, несколько участников — дни с общими пересечениями.

Если понадобится date range, keyboard grid по WAI-ARIA APG или глубокая кастомизация month/year selectors, пересмотреть решение и сравнить с CDK-based custom datepicker или Angular Material Datepicker.

## Проверки После Изменений Компонентов

```bash
npm run format
npm run check
npm run a11y
```

`npm run a11y` может требовать запуск вне sandbox, потому что Playwright Chromium в текущей среде падает внутри sandbox.
