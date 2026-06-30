# Frontend ConfCall Scheduler

Angular 19 SPA с standalone components, lazy-loaded страницами, signals для локального UI-состояния и RxJS-сервисами для API-данных.

## Запуск

Из корня проекта:

```bash
npm run dev:fe
```

Frontend будет доступен на `http://localhost:4200/`. Команда запускает Angular dev server с `proxy.conf.json`, поэтому запросы `/api/*` уходят на backend `http://localhost:3000`.

## Структура

- `src/app/core` — модели и сервисы API.
- `src/app/shared` — общие компоненты: navbar, icon, modal.
- `src/app/features` — страницы по пользовательским сценариям.
- `src/styles/_tokens.scss` — глобальные design tokens.
- `src/styles.scss` — глобальные стили и стили внешних UI-элементов.

## UI

Компонентные SCSS-файлы должны использовать tokens из `src/styles/_tokens.scss`: цвета, радиусы, отступы, размеры шрифтов и контролов. Новые hardcoded colors в component SCSS не добавляются без необходимости.

На `/book` используется `ccs-date-input` на flatpickr для даты/диапазона и кастомный dropdown для длительности. Stepper состоит из трёх шагов: группа, участники, доступное время. Шаг `Доступное время` построен на reactive form: при изменении режима, даты, диапазона или длительности пересечения пересчитываются автоматически без кнопки ручного поиска. Публичная ссылка создаётся из этого шага через модальное окно, а управление созданными ссылками находится на `/booking-links`.

## Проверка

Из корня проекта:

```bash
npm run check
npm run ui:screenshot:docker
```
