# AGENTS.md — ConfCall Scheduler

## Общее описание

**ConfCall Scheduler** — система бронирования видеозвонков для программных комитетов конференций. Каждый член комитета указывает часы своей доступности, а система находит **пересечение времени** для всех участников и автоматически создаёт ссылку на видеовстречу.

**Теги проекта:** `#angular` `#nestjs` `#mysql` `#groups` `#availability-calendar` `#booking` `#meetings` `#invite-auth` `#profile` `#i18n` `#telemost` `#cdk-overlay` `#design-tokens`

## Быстрый маршрут для AI-агента

Для общего входа в проект сначала прочитать [AI_ONBOARDING.md](./AI_ONBOARDING.md). Он описывает порядок знакомства, какие документы подключать по типу задачи и как формулировать контекст для AI-агента.

| Тег                      | Файлы                                                                                                       | Назначение                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `#availability-calendar` | `frontend/src/app/features/availability/pages/availability.page.{ts,html,scss}`, `frontend/src/app/features/availability/components/availability-month-grid/` | Month-view календарь доступности, легенда, свободные слоты и занятые встречи                                    |
| `#availability-dialog`   | `frontend/src/app/features/availability/components/availability-event-dialog/`                              | Диалог создания разового или повторяющегося слота                                                               |
| `#availability-day`      | `frontend/src/app/features/availability/components/availability-day-details/`                               | Модальное окно расписания дня, редактирование и удаление слотов                                                 |
| `#groups`                | `server/src/group/`, `frontend/src/app/core/services/group.service.ts`, `/groups`, `/book`                  | Группы, аватар группы, приглашения по email, участники, публичные ссылки                                        |
| `#meeting-details`       | `frontend/src/app/features/availability/components/meeting-details-dialog/`                                 | CDK Dialog с информацией о встрече из календаря                                                                 |
| `#book-flow`             | `frontend/src/app/features/book/`, `server/src/availability/`                                               | Выбор группы, участников, reactive form автопоиска по одной дате или диапазону, общие промежутки и бронирование |
| `#meetings`              | `frontend/src/app/features/meetings/`, `server/src/meeting/`                                                | Список встреч, новые встречи, отмена                                                                            |
| `#auth-invites`          | `server/src/auth/`, `server/src/group/`, `/login`, `/reset-password`, `/invite`, `/groups`                  | Dev-auth, приглашения по email, email verification, login/password reset                                        |
| `#profile`               | `server/src/auth/`, `frontend/src/app/features/settings/`, `frontend/src/app/core/services/auth.service.ts` | Профиль пользователя: имя, фото, язык интерфейса                                                                |
| `#i18n`                  | `frontend/src/app/core/i18n/`, `frontend/src/app/app.component.ts`                                          | Runtime-локализация ru/en/es/zh, словари и root-директива перевода                                              |
| `#ui-shared`             | `frontend/src/app/shared/`, `frontend/src/styles.scss`                                                      | SVG-иконки, модалки, тосты, tooltip, общие классы                                                               |
| `#design-tokens`         | `frontend/src/styles/_tokens.scss`                                                                          | Цвета, размеры, радиусы, семантические цвета календаря                                                          |

---

## Навигация и названия UI

- Технический маршрут `/dashboard` в интерфейсе называется `Главная`.
- Заголовок страницы `/dashboard` — `Обзор встреч`.
- Не использовать пользовательские формулировки `Панель` и `Панель управления` для этого раздела.
- Группы и приглашения участников находятся в `/groups`; публичные ссылки бронирования создаются в `/book` после выбора группы, участников и доступного времени, а управляются в `/booking-links`; профиль находится в `/profile`; старый `/settings` остаётся совместимым редиректом.
- Правила доступности для UI-задач находятся в [ACCESSIBILITY.md](./ACCESSIBILITY.md); при изменении интерактивных компонентов проверять keyboard flow, aria-labels, focus states и live regions.
- Публичные фронтенд-маршруты: `/` (публичная главная), `/login` и `/book/:slug`. Все остальные маршруты защищены guards и при отсутствии авторизации редиректят на `/login`.
- На backend авторизацию централизует global guard. Публичные NestJS handlers помечаются `@Public()`, текущий пользователь читается через `@CurrentUser()`.
- Backend-ошибки и бизнес-сообщения API должны приходить как `messageKey` и, при необходимости, `messageParams`; фронтенд переводит их через runtime i18n.

---

## Как Быстро Ознакомиться С Проектом

1. Прочитать [AI_ONBOARDING.md](./AI_ONBOARDING.md), затем этот файл.
2. Для продуктового контекста открыть [README.md](./README.md).
3. Для UI-задач открыть [COMPONENTS.md](./COMPONENTS.md) и [ACCESSIBILITY.md](./ACCESSIBILITY.md).
4. Для архитектуры, API, БД и интеграций открыть [ADR.md](./ADR.md) и [TECH_STACK.md](./TECH_STACK.md).
5. Для запуска открыть [RUN_PROJECT.md](./RUN_PROJECT.md).
6. После чтения документов смотреть ближайший feature-модуль и только потом shared/core код.

AI-агенту полезно явно сообщить цель пользователя, URL или feature-тег, ограничения по API/дизайну и требуемые проверки. Для UI-задач сначала искать дублирование сценариев и лишние акценты, а не добавлять новые блоки.

- Для UI/UX-задач сначала проектировать наилучший пользовательский сценарий для реального экрана, включая bulk actions, состояния пустоты и навигацию; код и тексты должны следовать выбранному UX, а не подменять его.

---

## Архитектура

### Стек технологий

| Слой          | Технологии                                                              |
| ------------- | ----------------------------------------------------------------------- |
| **Frontend**  | Angular 19 (standalone, signals), RxJS 7, TypeScript 5.8                |
| **Backend**   | NestJS 11, TypeScript, Drizzle ORM                                      |
| **Database**  | MySQL                                                                   |
| **Auth**      | Dev-auth mock, приглашения по email и регистрация по invite-ссылке      |
| **Video**     | Яндекс Телемост REST API, Jitsi (future)                                |
| **UI**        | Runtime i18n, SCSS design tokens, Angular CDK Overlay/Dialog, flatpickr |
| **Deploy**    | Static hosting (SPA fallback через .html файлы)                         |
| **Dev infra** | Docker Compose (`mysql:8.4`, Playwright)                                |

---

## Структура проекта

```
app/
├── db/
│   ├── schema.ts               # Drizzle ORM: users, groups, group_members, availability_slots, meetings, participants, booking_links, booking_link_participants, group_invitations
│   ├── seed.ts                 # Начальное заполнение БД
│   └── relations.ts            # Отношения между таблицами
├── drizzle.config.ts           # Конфигурация Drizzle Kit
├── docker-compose.yml          # MySQL для локальной разработки
├── db/                          # Drizzle миграции (генерируются)
├── frontend/
│   ├── angular.json             # Конфиг Angular CLI
│   ├── tsconfig.json, tsconfig.app.json
│   └── src/
│       ├── main.ts              # Bootstrap Angular
│       ├── index.html           # Entry point
│       ├── styles.scss          # Глобальные стили
│       ├── styles/
│       │   └── _tokens.scss     # Цвета, отступы, радиусы, размеры контролов
│       └── app/
│           ├── app.component.ts   # Корневой компонент
│           ├── app.config.ts      # DI-провайдеры (Router, HttpClient)
│           ├── app.routes.ts      # Маршруты Angular (lazy-load)
│           ├── core/
│           │   ├── models/api.model.ts        # Общие типы (User, locale, Meeting, Slot)
│           │   ├── i18n/                       # Runtime-локализация и словари ru/en/es/zh
│           │   └── services/
│           │       ├── api-client.service.ts  # Базовый HTTP-клиент
│           │       ├── auth.service.ts         # Signals + Observable
│           │       ├── availability.service.ts # BehaviorSubject + shareReplay
│           │       ├── meeting.service.ts      # Auto-refresh через Subject
│           │       ├── booking.service.ts      # CRUD публичных booking links
│           │       ├── group.service.ts        # Группы, аватары, участники, приглашения по email
│           │       ├── modal.service.ts        # Единые модальные окна
│           │       └── toast.service.ts        # Очередь toast-уведомлений
│           ├── shared/
│           │   └── components/
│           │       ├── navbar/      # Навбар (.ts + .html + .scss)
│           │       ├── icon/        # SVG-иконки из assets/icons
│           │       ├── modal/       # Глобальная модалка приложения
│           │       ├── toast/       # Toast host через CDK Overlay
│           │       └── tooltip/     # Переиспользуемый tooltip через CDK Overlay
│           └── features/
│               ├── login/pages/login.page.{ts,html,scss}
│               ├── dashboard/pages/dashboard.page.{ts,html,scss}
│               ├── availability/
│               │   ├── components/availability-event-dialog/ # Диалог слота доступности
│               │   ├── components/availability-day-details/  # Модальное окно расписания конкретного дня
│               │   ├── components/availability-month-grid/   # Сетка month-view календаря
│               │   ├── components/meeting-details-dialog/    # Просмотр встречи из календаря
│               │   ├── models/availability-calendar.model.ts # Общие типы и константы календаря доступности
│               │   ├── models/availability-event-dialog.model.ts
│               │   └── pages/availability.page.{ts,html,scss}
│               ├── book/
│               │   └── pages/book.page.{ts,html,scss}
│               ├── meetings/pages/meetings.page.{ts,html,scss}
│               ├── settings/pages/settings.page.{ts,html,scss}
│               └── public-booking/pages/public-booking.page.{ts,html,scss}
├── server/                       # NestJS backend
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts              # Entry point NestJS
│       ├── app.module.ts        # Корневой модуль
│       ├── db/db.module.ts      # Drizzle ORM Provider (global)
│       ├── auth/
│       │   ├── dto/auth.dto.ts
│       │   ├── auth.service.ts     # Dev-auth, профиль, регистрация по invite-ссылке
│       │   ├── auth.controller.ts  # /auth/*
│       │   └── auth.module.ts
│       ├── group/
│       │   ├── dto/group.dto.ts
│       │   ├── group.service.ts     # Группы, участники, приглашения по email
│       │   ├── group.controller.ts  # /groups/*
│       │   └── group.module.ts
│       ├── availability/
│       │   ├── dto/availability.dto.ts
│       │   ├── availability.service.ts    # Бизнес-логика пересечения
│       │   ├── availability.controller.ts # GET/POST /availability/*
│       │   └── availability.module.ts
│       ├── meeting/
│       │   ├── dto/meeting.dto.ts
│       │   ├── meeting.service.ts     # CRUD + video integration
│       │   ├── meeting.controller.ts  # /meetings/*
│       │   └── meeting.module.ts
│       ├── booking/
│       │   ├── dto/booking.dto.ts
│       │   ├── booking.service.ts     # Публичные ссылки + бронирование
│       │   ├── booking.controller.ts  # /booking/*
│       │   └── booking.module.ts
│       ├── video/
│       │   ├── video.service.ts       # Абстракция видеоплатформы
│       │   └── video.module.ts
│       └── user/
│           └── user.module.ts
├── package.json                  # Корневой package.json
├── nest-cli.json                 # Конфиг NestJS CLI
├── e2e/                          # Playwright specs и screenshot-сценарии
└── deploy/                       # Папка для деплоя (генерируется)
    ├── index.html                # SPA entry
    ├── login.html, book.html, ... # Fallback файлы для каждого маршрута
    ├── main-*.js, chunk-*.js     # Бандлы Angular
    └── styles-*.css              # Стили
```

---

## Ключевые файлы

### 1. База данных — db/schema.ts

Основные таблицы:

- **users** — пользователи (unionId, name, email, avatar, locale, role)
- **availability_slots** — Слоты доступности (userId, dayOfWeek 0-6, startTime/endTime в формате "HH:MM")
- **meetings** — Встречи (organizerId, title, startTime, endTime, videoUrl, status)
- **meeting_participants** — Участники встреч (meetingId, email, name, status)
- **booking_links** — Публичные ссылки для бронирования (slug, groupId, title, durationMinutes, isActive)
- **booking_link_participants** — выбранные участники конкретной публичной ссылки
- **groups** — группы пользователей (name, avatar, createdByUserId)
- **group_members** — участники групп (groupId, userId, role owner/member)
- **group_invitations** — Приглашения в группы (groupId, email, token, status, invitedByUserId, acceptedAt, expiresAt)

### 2. Auth и регистрация — auth.service.ts

В dev-режиме используется простой Bearer token формата `dev-token:<userId>`.

- `POST /api/auth/dev-login` — bootstrap-вход администратора `Dev User`
- `GET /api/auth/me` — текущий пользователь по Bearer token
- `POST /api/auth/register-with-invite` — регистрация только по валидной ссылке приглашения; пользователь создает аккаунт по email, а затем автоматически добавляется в группу
- `POST /api/auth/resend-verification` — повторная отправка ссылки подтверждения для неподтверждённого email
- `POST /api/auth/login` — вход по email и паролю после подтверждения email
- `POST /api/auth/password-reset/request` — отправка ссылки сброса пароля на email
- `POST /api/auth/password-reset/confirm` — установка нового пароля по токену из письма
- `POST /api/auth/verify-email` — подтверждение email по токену из письма; после успешной проверки учётная запись активируется
- `GET /api/groups` — группы текущего пользователя
- `POST /api/groups` — создать группу, текущий пользователь становится `owner`
- `POST /api/groups/:id` — обновить название или аватар группы, только `owner`
- `POST /api/groups/:id/invitations` — отправить приглашения на список email, только `owner`
- `GET /api/groups/:id/invitations` — список приглашений группы, доступно участникам группы
- `GET /api/groups/invites/:token` — публичное получение данных приглашения
- `POST /api/groups/invites/:token/accept` — принять приглашение после входа в аккаунт

Новые пользователи не могут регистрироваться свободно: владелец группы вводит список email в `/groups`, подтверждает его и приложение отправляет письма с ссылкой на `/invite?token=...`. Если пользователь уже есть в системе, он может войти и принять приглашение. Если пользователя ещё нет, он регистрируется прямо по ссылке приглашения и сразу попадает в группу. На `/login` есть режимы входа по email и паролю и запроса сброса пароля; ссылка сброса открывает `/reset-password`.

### 2.1 Группы и бронирование

- Пользователь может владеть несколькими группами или быть участником нескольких групп.
- В `/groups` создаются группы, редактируется аватар группы, добавляются участники по email и отправляются приглашения выбранной группы. Создание группы, редактирование основной информации и приглашение участников открываются через компактные header action-кнопки и `ccs-modal-shell`, а не через постоянно видимые широкие формы.
- В `/book` после выбора группы, участников и доступного времени создаются публичные ссылки бронирования. Ссылка относится к выбранной части участников; модальное окно создания предзаполняет длительность из шага `Доступное время`.
- В `/booking-links` созданные ссылки можно открыть, скопировать, отправить на произвольный email, отключить, снова включить или удалить. Повторное включение должно снова делать тот же `slug` доступным для просмотра и бронирования. Не возвращать список публичных ссылок в stepper `/book`.
- Публичная ссылка открывает `/book/:slug`. Гость без аккаунта видит группу, аватар группы, участников, подсвеченные даты со свободным временем, доступные слоты и форму своих контактных данных.
- Если публичная ссылка неактивна, backend возвращает `410 Gone` с `messageKey: "booking.link_inactive"`, а frontend показывает локализованное временное состояние без формы бронирования и кнопку повторной проверки. Не писать, что ссылка навсегда недоступна: организатор может включить её снова.
- `GET /api/booking/public/:slug` возвращает плоский контракт `group: { id, name, avatar, members } | null`; не использовать старую вложенную форму `{ group, members }`.
- В `/book` сначала выбирается группа, затем участники только из этой группы. Есть компактный поиск по группам и участникам; он не должен быть главным визуальным акцентом.
- `/book` имеет три шага: группа, участники, доступное время. Четвёртый шаг не возвращать; функциональность выбора внутреннего или публичного сценария находится внутри шага `Доступное время`.
- Шаг `Доступное время` использует reactive form с контролами `mode`, `singleDate`, `rangeStart`, `rangeEnd`, `duration`. Пересечения загружаются автоматически при входе на шаг и при изменении этих контролов через `valueChanges`, `debounceTime(...)` и `takeUntilDestroyed(...)`; кнопку `Показать варианты` и `search-summary-card` не возвращать.
- Результаты поиска в `/book` должны визуально совпадать для `Любая` и конкретной длительности: использовать единый card-паттерн слота с датой, временем, длительностью и действием бронирования. Для диапазона дат показывать только дни, где есть реальные пересечения.
- Страница `/booking-links` должна оставаться лаконичной: URL должен быть кликабельной ссылкой, а действия со ссылкой — иконками с tooltip/aria-label.
- Backend `POST /api/meetings` принимает `groupId` и проверяет, что организатор и все выбранные зарегистрированные участники состоят в этой группе.
- `GET /api/availability/users?groupId=...` возвращает только пользователей выбранной группы и проверяет членство текущего пользователя.
- `GET /api/availability/intersection` принимает `groupId` и проверяет, что все `userIds` входят в выбранную группу. Для одной даты передавать `date=YYYY-MM-DD`; для диапазона — `startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`. API-контракт дат — только date-only ISO `YYYY-MM-DD`; UI-форматы вроде `ДД.ММ.ГГГГ` не отправлять на backend.
- Ответ для одной даты содержит `availableRanges` — полные общие свободные промежутки, и `availableSlots` — нарезку этих промежутков по выбранной длительности. Диапазон имеет форму `{ days: [{ date, availableSlots, availableRanges, messageKey, unavailableUserIds }], messageKey }`; в UI показывать только дни с реальными пересечениями.
- `availableRanges` и `availableSlots` могут содержать `sources`: provenance интервала по пользователям и источникам `weekly`/`calendar`. Это нужно для диагностики повторяющихся слотов и будущих UX-пояснений, но основной пользовательский результат остаётся “когда можно встретиться”.
- Для диапазона дат `/book` должен отправлять один запрос `/availability/intersection` с `startDate` и `endDate`, а не делать запрос по каждому дню. Для подсветки дат в календарике `/book` также использовать один range-запрос на окно дат и передавать результат в `ccs-date-input.availableDates`.

### 3. Алгоритм пересечения — availability.service.ts

1. Получает `availability_slots` всех участников для дня недели
2. Проверяет что все участники имеют слоты
3. Получает существующие `meetings` этих участников
4. Вычисляет пересечение всех диапазонов
5. Вычитает занятые интервалы
6. Разбивает оставшиеся интервалы на слоты указанной длительности

### 4. Month-view доступность — availability page

- Основной термин в UI — **слот**, не “окно”.
- `availability.page` должен оставаться orchestration-страницей: month-grid, day-details и диалог редактирования слота живут в отдельных feature-компонентах.
- Основной способ редактирования доступности — клик по дню или компактная кнопка добавления внутри ячейки month-view календаря.
- Диалог слота доступности поддерживает режимы `Одноразово` и `Повторять`.
- Запланированные встречи пользователя отображаются в том же календаре отдельным типом chip. По клику открывается `meeting-details-dialog`. Прошедшие встречи определяются по `meeting.endTime < Date.now()` и показываются приглушёнными с зачёркнутыми временем и названием.
- Повторяемые числовые значения month-view календаря, например лимит видимых chip, шаг повторения по неделям и доменные date-константы, хранить в `models/availability-calendar.model.ts`, а не в теле страницы.
- Calendar math и conflict/merge логика слотов живут в `features/availability/utils/availability-calendar.utils.ts` и `features/availability/utils/availability-conflicts.utils.ts`; `availability.page` не должен снова разрастаться до монолита.
- Не добавлять отдельные блоки ниже календаря для той же функциональности: создание и удаление слотов должны быть доступны из календаря.
- При создании слота проверять пересечения с существующими календарными слотами:
  - разовый + разовый: предлагать объединить в один разовый слот;
  - регулярный + регулярный: предлагать объединить регулярные правила;
  - разовый + регулярный: спрашивать область действия — объединить только на дату, изменить регулярный слот или не создавать.
- Легенда календаря объясняет главный пользовательский смысл: **Свободно** и **Занято**. Разницу между разовым и повторяющимся свободным слотом показывать в тултипах/деталях, но не выделять отдельным сильным цветовым акцентом.
- Цвета календарных chip и маркеров берутся из semantic tokens в `_tokens.scss`: `--color-slot-free`, `--color-slot-busy` и overlay-пары. Compatibility-токены `--color-slot-recurring`, `--color-slot-date`, `--color-slot-meeting` не должны использоваться как повод визуально дробить свободные слоты.

### Angular selectors

- Все публичные selectors компонентов и UI-директив используют префикс `ccs`.
- Примеры: `<ccs-navbar>`, `<ccs-selectable-card-grid>`, `<ccs-availability-event-dialog>`, `ccsTooltip`.
- Новый selector с префиксом `app` не добавлять.

### Runtime i18n

- Словари лежат в `frontend/src/app/core/i18n/dictionaries/` по одному файлу на язык.
- Ключи переводов должны быть английскими lowercase-идентификаторами, например `profile.save` или `nav.dashboard`.
- Ключи в каждом словаре должны быть отсортированы по алфавиту. Перед сохранением словаря сортировать добавленные ключи или сразу вставлять их в правильную позицию, чтобы не появлялись дубликаты.
- Не использовать UI-фразы, русский текст или разные варианты регистра как ключи переводов.
- Регистр, размер и визуальный акцент текста задаются стилями и HTML-структурой, а не исходным написанием ключа.
- Fallback по старым UI-фразам не использовать: пользовательский текст должен проходить через явный i18n-ключ.
- В стилях избегать `!important`. Если без него не получается, сначала пересмотреть специфичность селектора или структуру DOM; исключение требует отдельного обоснования и локальной правки.
- Допустимое исключение: vendor-overrides в `frontend/src/styles/vendors/*`, когда нужно перебить встроенную тему сторонней библиотеки без риска расползания каскада по проекту.

### 5. UI tokens — frontend/src/styles/\_tokens.scss

Цвета, overlay, shadow, focus ring, радиусы, отступы, размеры шрифтов, размеры контейнеров и контролов вынесены в CSS custom properties. Новые SCSS-правки должны переиспользовать эти переменные, а не добавлять hardcoded `#hex`/`rgb()` в компонентные стили. Если нужен новый цветовой смысл, сначала добавить semantic token в `_tokens.scss`, затем использовать его в компоненте.

### 5.1 Layout stability

- Интерфейс не должен прыгать при переключении режимов, фильтров, вкладок и состояний загрузки.
- Если нужно показать альтернативный режим, сохраняйте геометрию блока и меняйте только содержимое или `visibility`, а не высоту и ширину контейнера.
- Для переключаемых форм и календарных контролов предпочтительно заранее резервировать место под альтернативное состояние.

### 6. Бронирование — book.page

Страница `/book` использует общий `ccs-date-input` на flatpickr для одиночной даты и диапазона дат. Дата редактируется вручную в локальном формате, но наружу из control/frontend-сервиса уходит ISO `YYYY-MM-DD`. Длительность выбирается кастомным dropdown, значение по умолчанию — `Любая`. Шаг `Доступное время` не имеет ручной кнопки поиска: результаты пересчитываются автоматически от reactive form.

Публичная страница `/book/:slug` также использует `ccs-date-input`. Вход `availableDates` подсвечивает даты, на которые есть свободные варианты. На `/book` тот же механизм подсвечивает свободные дни одного выбранного участника или даты общих пересечений нескольких участников; легенда и tooltip объясняют жёлтый маркер даты со свободным временем.

### 7. Модальные окна

В приложении используется `ModalService`, общий `ModalComponent` и `ccs-modal-shell`.

- `ModalService` — только для простых сценариев `info`, `error`, `confirm`, `choose`.
- `ccs-modal-shell` — обязательный каркас для всех содержательных модальных окон: бронирование, детали встречи, настройка слота, расписание дня.
- Feature-компонент может владеть формой и бизнес-логикой, но не должен дублировать shell-card, header, close button, footer и shadow-стили.
- Native `alert`/`confirm` не используются.
- При `NavigationStart` корневой `AppComponent` закрывает все CDK Dialog окна через `Dialog.closeAll()` и очищает тосты через `ToastService.clear()`. Новые transient overlay-компоненты должны идти через CDK Dialog/`ModalService` или `ToastService`, чтобы автоматически исчезать при переходе на другой маршрут.

### 7.1 Реестр компонентов

Перед добавлением нового UI-компонента проверить [COMPONENTS.md](./COMPONENTS.md). Если паттерн уже есть (`ccs-modal-shell`, `ccs-date-input`, `ccs-time-select`, `ccs-dropdown`, `ccsTooltip`, `svg-icon`), переиспользовать его вместо локальной реализации.

### 7.2 Tooltip

Tooltip реализован через `TooltipDirective` и `TooltipComponent` на Angular CDK Overlay:

```html
<button ccsTooltip="Пояснение">...</button>
```

Не использовать native `title` и локальные CSS-tooltip через `content: attr(...)`, если подсказка должна быть частью UI.

### 8. SPA Fallback — deploy/\*.html

Статический хостинг не поддерживает URL без расширений (`/book`). Для каждого маршрута создаётся fallback-файл `book.html` — копия `index.html`. При прямом открытии `/book` сервер находит `book.html`, Angular загружается и роутер обрабатывает URL.

---

## Локальный запуск

```bash
npm install
npm run db:up
npm run db:push
npm run dev:be
npm run dev:fe
```

MySQL запускается через `docker-compose.yml`:

- host: `localhost`
- port: `3306`
- database: `confcall_scheduler`
- user: `user`
- password: `password`

`.env` должен содержать:

```env
MYSQL_DATABASE=confcall_scheduler
MYSQL_USER=app_user
MYSQL_PASSWORD=change_me_mysql_password
MYSQL_ROOT_PASSWORD=change_me_mysql_root_password
DATABASE_URL=mysql://app_user:change_me_mysql_password@localhost:3306/confcall_scheduler
```

---

## Принципы разработки

| Принцип            | Применение                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **DRY**            | Один `ApiClientService` для всех HTTP-запросов, общая модель в `api.model.ts`                |
| **KISS**           | Простые сервисы с `BehaviorSubject`, компоненты без сложной логики                           |
| **AHA**            | Алгоритм пересечения времени — в сервисе, не в компоненте; видео — абстракция `VideoService` |
| **SoC**            | Templates → .html, Styles → .scss, Logic → .ts                                               |
| **Lazy Loading**   | Каждая страница — отдельный JS-чанк, загружается по требованию                               |
| **RxJS + Signals** | Сервисы возвращают `Observable` (async pipe), компоненты хранят состояние в `signal()`       |

### Правило DRY и переиспользования

- Не дублировать одинаковые конструкции, шаблоны, стили, DTO, типы и вычисления.
- Если повторяется логика или структура данных, сначала искать общий компонент, helper, service, type или token, а уже потом добавлять новый локальный код.
- Не копировать блоки ради быстрого решения, если их можно вынести в переиспользуемый контракт или общий UI-паттерн без потери читаемости.
- При рефакторинге сохранять поведение и предпочтительно упрощать структуру, а не размножать похожие реализации.

### Правила RxJS

- `subscribe()` используется только как конечный триггер цепочки.
- Внутри `subscribe(...)` не должно быть бизнес-логики и побочных эффектов.
- Вся логика обработки данных должна жить в `tap`, `map`, `filter`, `switchMap`, `catchError`, `finalize` и похожих операторах.
- Для одноразовых действий предпочтительнее собирать цепочку до конца и завершать её пустым `subscribe()`.
- Вложенные `subscribe()` не использовать, если задачу можно выразить через операторы.

### Правила типов и чтения данных

- Если значение можно описать через `type` или `interface`, не использовать `any` и не оставлять неявные структуры без типа.
- Для повторно используемых контрактов, DTO, моделей и данных компонентов предпочтительнее `interface`.
- Для объединений, литеральных наборов и вычисляемых алиасов предпочтительнее `type`.
- При доступе к свойствам объекта по возможности использовать ES6 object destructuring, если это улучшает читаемость и снижает визуальный шум.
- Не использовать destructuring там, где он ухудшает понимание потока данных или разрывает связь между значением и его контекстом.
- Не дублировать структуру объекта в нескольких местах, если её можно выразить одной общей TS-моделью.
- Если один и тот же контракт используется в нескольких компонентах или сервисах, вынести его в отдельный `models/*.ts` файл, доступный всем потребителям.
- Не держать общие DTO и UI-контракты внутри одного компонента, если они уже стали частью межкомпонентного взаимодействия.
- Если page-компонент разрастается и начинает совмещать несколько самостоятельных UI-блоков, выносить их в feature-компоненты поменьше с явными `Input`/`Output`, а не наращивать страницу дальше.
- Не оставлять магические числа и строки с доменным смыслом внутри компонентов и сервисов. Повторяемые или значимые значения выносить в именованные константы рядом с моделью или feature-контекстом.

### Правила форм

- Предпочитать reactive forms; template-driven forms не использовать без явной причины.
- Для полей ввода, которые влияют на состояние через `valueChanges`, добавлять `debounceTime(...)` и завершать поток через `takeUntilDestroyed(...)`.
- Если форма взаимодействует с сервисом или вычислением данных, держать логику в `FormGroup` / `FormControl`, а не в шаблоне.
- Для сабмита формы использовать typed form values и явные TS-типы, а не чтение значений прямо из DOM.

---

## Видеоплатформы (исследование)

| Платформа           | API              | Статус                                                                                     |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| **Яндекс Телемост** | REST API + OAuth | ✅ `VideoService` создаёт конференции через Telemost API; требуется `TELEMOST_OAUTH_TOKEN` |
| **Jitsi Meet**      | Self-hosted      | 🔄 Возможна интеграция (open-source)                                                       |
| **TrueConf**        | REST API v3.8    | 🔄 Возможна (self-hosted)                                                                  |
| **SaluteJazz**      | Web SDK          | 🔄 Корпоративные лицензии                                                                  |

---

---

## Деплой

```
Проект: static
Путь: dist/deploy/
```

Файлы в `deploy/`:

- `index.html` — корневой entry
- `login.html`, `dashboard.html`, `book.html`, `availability.html`, `meetings.html`, `groups.html`, `profile.html`, `access.html`, `settings.html` — fallback для каждого маршрута
- `main-*.js`, `polyfills-*.js`, `chunk-*.js` — бандлы Angular (hash для кеш-бустинга)
- `styles-*.css` — стили
