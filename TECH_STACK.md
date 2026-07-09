# Инструменты и библиотеки проекта

Этот файл объясняет, зачем в проекте используется каждый основной инструмент и какую задачу он решает.

Для AI-агентов: перед заменой библиотеки или добавлением новой зависимости сначала проверить этот документ, [ADR.md](./ADR.md) и [AI_ONBOARDING.md](./AI_ONBOARDING.md). Новую зависимость добавлять только если существующий стек не закрывает задачу.

## Runtime и язык

### Node.js

Используется для запуска backend, Angular tooling, Drizzle Kit, Playwright и npm scripts.

### TypeScript

Общий язык frontend и backend. Даёт типы для Angular-компонентов, NestJS-сервисов, DTO и Drizzle schema.

### npm

Менеджер пакетов и runner команд проекта. Основные команды находятся в корневом `package.json`.

## Frontend

### Angular 19

Основной frontend-фреймворк. Используется для SPA, роутинга, компонентов страниц и шаблонов.

В проекте Angular решает задачи:

- маршруты `/dashboard` (`Главная`, страница `Обзор встреч`), `/availability`, `/groups`, `/book`, `/meetings`, `/profile`, `/login`;
- standalone components без NgModule boilerplate;
- lazy loading страниц;
- reactive forms через `ReactiveFormsModule`;
- реактивный UI через signals и `async` pipe.

### Angular Router

Управляет переходами между экранами приложения. Роуты описаны в `frontend/src/app/app.routes.ts`.

### Angular CDK

Используется для overlay-based UI: `Dialog` для модальных окон, `ConnectedOverlay` для dropdown-меню, overlay-host для toast-уведомлений и tooltip.

В проекте Angular CDK нужен для:

- единых модальных окон без самописных backdrop и focus-handling;
- dropdown-меню, которые сами выбирают позицию сверху или снизу;
- toast-уведомлений с очередью и приоритетами;
- переиспользуемых tooltip через `TooltipDirective` и `TooltipComponent`.

Сейчас на CDK также построены toast-уведомления через `ToastService` и `ToastHostComponent`.

### Angular Signals

Используются для локального состояния компонентов: loading/error flags, выбранные участники, форма бронирования, выбранные фильтры, состояние модалок.

### Runtime i18n

Локализация реализована локально без внешней зависимости: `I18nService`, typed словари и `t` pipe находятся в `frontend/src/app/core/i18n/`.

Почему не Angular built-in i18n: в проекте язык выбирается пользователем в профиле и должен меняться без отдельного билда и перезагрузки на `/en`, `/es`, `/zh`. Runtime-подход лучше подходит для Angular standalone/signals в текущей архитектуре.

Поддерживаемые языки: `ru`, `en`, `es`, `zh`. Выбор сохраняется в `users.locale` через `PATCH /api/auth/me` и дублируется в `localStorage`, чтобы интерфейс мог применить язык до завершения загрузки профиля.

Словари разделены по языкам в `frontend/src/app/core/i18n/dictionaries/`. Ключи переводов должны быть стабильными английскими lowercase-идентификаторами (`profile.save`, `nav.dashboard`) и не должны зависеть от регистра или исходного написания UI-текста. Визуальный регистр, размер и акцент текста задаются HTML/CSS, а не ключом перевода. Fallback по старым UI-фразам не используется: пользовательский текст должен проходить через явный i18n-ключ.

### RxJS

Используется в сервисах для HTTP-потоков и кэширования данных.

В проекте RxJS нужен для:

- `BehaviorSubject`/`ReplaySubject` с текущими встречами, доступностью и booking-ссылками;
- `Observable` API в frontend-сервисах;
- `shareReplay` для переиспользования данных;
- `switchMap`, `tap`, `finalize`, `catchError` для обработки API-запросов.

### Zone.js

Angular runtime dependency для change detection.

### SCSS

Используется для стилей компонентов Angular. Каждый экран хранит стили рядом с template и TypeScript-файлом.

Глобальные design tokens находятся в `frontend/src/styles/_tokens.scss`. В них описаны цвета, overlay/shadow/focus, радиусы, spacing, размеры шрифтов, размеры контейнеров и контролов. Компонентные стили должны переиспользовать CSS variables из tokens. В календаре доступности используются семантические токены свободного и занятого времени: `--color-slot-free`, `--color-slot-busy`, `--overlay-slot-free`, `--overlay-slot-busy`.

### flatpickr

Используется через общий `ccs-date-input` для выбора даты встречи, поиска доступного времени на `/book` и публичного бронирования.

В проекте flatpickr нужен для:

- выпадающего календаря, стилизованного под приложение;
- русской локали;
- открытия календаря относительно поля даты;
- поддержки ручного ввода даты рядом с выбором из календаря;
- подсветки дат со свободным временем через `availableDates` и общий класс `ccs-flatpickr-day--available`.

UI может отображать дату в локальном формате, но frontend-сервисы отправляют на backend только date-only ISO `YYYY-MM-DD`.

### Month-view availability editor

Не отдельная библиотека, а комбинация Angular signals, reactive forms и локального overlay внутри страницы. Используется на `/availability`, чтобы через ячейку месяца или компактную кнопку добавления открывать диалог создания разового или повторяющегося свободного слота без дополнительных секций ниже календаря. В этом же календаре отображаются занятые интервалы встреч; по клику открывается CDK Dialog с деталями встречи. Прошедшие встречи визуально приглушаются и зачеркиваются. Визуальная легенда разделяет свободное и занятое время, а не типы свободных правил.

Сейчас month-view разбит на feature-компоненты:

- `ccs-availability-month-grid` отвечает за сетку месяца, chip слотов, roving tabindex по дням и day-level действия;
- `ccs-availability-day-details` отвечает за содержимое модального окна расписания дня;
- `availability.page` оставлен orchestration-страницей и держит загрузку данных, month navigation, persistence и conflict-handling.

Общие типы и константы календаря лежат в `features/availability/models/availability-calendar.model.ts`, чтобы не держать доменные структуры и магические числа внутри page-компонента. Calendar math и conflict/merge логика вынесены в `features/availability/utils/availability-calendar.utils.ts` и `features/availability/utils/availability-conflicts.utils.ts`.

При создании слота календарь проверяет пересечения. Разовые слоты можно объединять с разовыми, регулярные правила — с регулярными правилами. Если разовый слот пересекается с регулярным, пользователь выбирает область действия: объединить только на конкретную дату, изменить регулярный слот для всех повторений или отменить создание.

### Angular selectors

Все публичные selectors компонентов и UI-директив используют проектный префикс `ccs`: `<ccs-navbar>`, `<ccs-selectable-card-grid>`, `ccsTooltip`. Префикс `app` не используется для новых Angular selectors.

## Backend

### NestJS

Основной backend-фреймворк. Используется для REST API, модульной структуры и dependency injection.

В проекте NestJS решает задачи:

- controllers для `/api/auth`, `/api/groups`, `/api/availability`, `/api/meetings`, `/api/booking`;
- services с бизнес-логикой;
- modules для изоляции предметных областей;
- глобальная конфигурация через `ConfigModule`;
- validation pipe для DTO.

### @nestjs/config

Загружает `.env` и даёт `ConfigService`. Используется для `DATABASE_URL`, `TELEMOST_OAUTH_TOKEN` и других настроек.

### @nestjs/throttler

Подключён для rate limiting API. Сейчас задаёт базовый лимит запросов и может быть расширен для публичных endpoints.

### nodemailer

Используется backend-сервисом email-уведомлений для отправки ссылки подтверждения регистрации через SMTP Яндекс Почты.

### @nestjs/platform-express

HTTP adapter NestJS на Express.

### class-validator

Валидирует DTO backend-запросов: обязательные строки, массивы, числа, вложенные DTO.

### class-transformer

Преобразует query/body значения в нужные типы, например строки query parameters в числа или массивы.

## База данных

### MySQL 8.4

Основная реляционная база данных.

Хранит:

- пользователей;
- доступность;
- встречи;
- участников встреч;
- booking-ссылки;
- календарные интеграции;
- группы и участников групп;
- приглашения в группы.

### Drizzle ORM

TypeScript ORM/query builder. Схема описана в `db/schema.ts`.

В проекте Drizzle нужен для:

- типизированных запросов к MySQL;
- insert/select/update/delete без ручного SQL в большинстве мест;
- общей схемы таблиц для backend.

### Drizzle Kit

CLI для синхронизации схемы с базой.

Команды:

- `npm run db:push` — применить schema changes к локальной MySQL;
- `npm run db:generate` — сгенерировать migration files;
- `npm run db:migrate` — применить migrations.

### mysql2

MySQL driver, который использует Drizzle для подключения к базе.

## Auth и доступ

### Dev Bearer token

Локальный auth-механизм проекта. Токен имеет формат:

```text
dev-token:<userId>
```

Frontend хранит его в `localStorage`, backend читает из `Authorization: Bearer`.

Нужен для разработки до подключения полноценного production OAuth/JWT.

### Приглашения в группы

Не библиотека, а доменное решение проекта. Ограничивают регистрацию: нового пользователя можно создать только по ссылке приглашения, которую владелец группы отправил на email. После регистрации или принятия приглашения пользователь добавляется в соответствующую группу.

### Публичные ссылки бронирования

Не библиотека, а доменное решение проекта. Участник группы создаёт ссылку на `/book` после выбора группы и нужных участников, может открыть её, скопировать, отправить на произвольный email, отключить, снова включить или удалить. Повторное включение делает тот же `slug` снова доступным. Гость без аккаунта видит общую доступность выбранных участников и бронирует свободный слот.

### Book reactive search form

Не отдельная библиотека, а frontend-паттерн страницы `/book`. Шаг `Доступное время` хранит режим одиночной даты/диапазона, дату, начало и окончание диапазона и длительность в typed reactive form. `valueChanges` с `debounceTime(...)` автоматически запускает поиск пересечений при изменении формы, а `takeUntilDestroyed(...)` завершает подписку при уничтожении страницы. Это заменяет ручную кнопку `Показать варианты` и убирает лишний GET/POST-style цикл в UI. Для диапазона используется один запрос `/availability/intersection` с `startDate` и `endDate`; фронтенд не должен собирать `forkJoin` из дневных запросов. Для подсветки дат в выпадающем календарике используется тот же range endpoint: один участник — свободные дни участника, несколько участников — дни с общими пересечениями.

### ModalService

Локальная frontend-абстракция для единых модальных окон. Заменяет native `alert` и `confirm` в пользовательских сценариях: создание встречи, отмена встречи, ошибки API, подтверждения действий.

### ToastService

Локальная frontend-абстракция для toast-уведомлений поверх Angular CDK Overlay. Поддерживает очередь с приоритетами, отображение в нижнем правом углу и `clear()` для очистки активных уведомлений, очереди и таймеров при смене маршрута.

## Интеграции

### Яндекс Телемост REST API

Используется для создания реальной видеоконференции при создании встречи.

Endpoint:

```text
POST https://cloud-api.yandex.net/v1/telemost-api/conferences
```

Нужен OAuth access token:

```text
TELEMOST_OAUTH_TOKEN
```

Токен должен иметь scope `telemost-api:conferences.create` и быть выпущен пользователем организации Яндекс 360 для бизнеса.

### Fetch API

Используется в backend `VideoService` для HTTP-запроса к Telemost API. В Node.js 22 доступен глобально.

## Локальная инфраструктура

### Docker

Используется для запуска сервисов без ручной установки MySQL и браузеров Playwright.

### Docker Compose

Описывает локальные services в `docker-compose.yml`:

- `mysql` — база данных;
- `playwright` — контейнер с браузерами для screenshot/e2e.

## Тестирование и визуальная проверка

### Playwright

Инструмент browser automation.

В проекте используется для:

- запуска Chromium в Docker;
- автоматического dev-login через API;
- открытия основных страниц;
- сохранения PNG-скриншотов интерфейса.

Команда:

```bash
npm run ui:screenshot:docker
```

Результат:

```text
artifacts/screenshots/
```

### Official Playwright Docker image

Образ:

```text
mcr.microsoft.com/playwright:v1.60.0-noble
```

Нужен, чтобы не устанавливать браузеры и системные зависимости вручную на хост-машину.

## Качество кода

### Prettier

Единое форматирование проекта.

Команда:

```bash
npm run format
```

### TypeScript compiler

Проверяет backend:

```bash
tsc -p server/tsconfig.build.json --noEmit
```

Команда `npm run check` также запускает Angular development build.

## Дополнительные зависимости

### nanoid

Генерирует короткие уникальные slug для публичных booking-ссылок.

### reflect-metadata

Нужен NestJS и decorator-based metadata.

### superjson

Установлен как dependency, но сейчас не является ключевым runtime-инструментом текущих user flows. Можно пересмотреть необходимость, если он нигде не используется.

### zod

Установлен как dependency, но основная backend-валидация сейчас построена на `class-validator`. Можно оставить для будущей схемной валидации или удалить, если не используется.

### @nestjs/swagger

Установлен, но полноценная Swagger-документация API сейчас не настроена. Может быть использован позже для OpenAPI.

### @analogjs/vite-plugin-angular, Vite, @vitejs/plugin-react

Присутствуют в зависимостях toolchain. Angular CLI/build использует Vite в development/build pipeline. React plugin сейчас не используется в коде приложения и может быть кандидатом на удаление после проверки зависимостей.
