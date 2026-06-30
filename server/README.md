# Backend ConfCall Scheduler

NestJS 11 API для авторизации, доступности, встреч, публичного бронирования и интеграции с Яндекс Телемостом.

## Запуск

Из корня проекта:

```bash
npm run dev:be
```

Команда поднимает MySQL через Docker Compose, применяет Drizzle schema и запускает backend на `http://localhost:3000/`.

## Переменные окружения

Минимально нужен `.env` в корне проекта:

```env
MYSQL_DATABASE=confcall_scheduler
MYSQL_USER=app_user
MYSQL_PASSWORD=change_me_mysql_password
MYSQL_ROOT_PASSWORD=change_me_mysql_root_password
DATABASE_URL=mysql://app_user:change_me_mysql_password@localhost:3306/confcall_scheduler
```

Для реального создания видеоконференций:

```env
TELEMOST_OAUTH_TOKEN=oauth_access_token
```

Токен Яндекс Телемоста должен иметь scope `telemost-api:conferences.create` и быть выпущен пользователем организации Яндекс 360 для бизнеса.

## Модули

- `auth` — dev-login, `/auth/me`, регистрация по промокоду, admin-only промокоды.
- `availability` — сохранение доступности и поиск пересечения свободного времени.
- `meeting` — создание, список, отмена встреч, отметка новых встреч просмотренными.
- `booking` — публичные ссылки и бронирование гостем.
- `video` — создание конференции в Яндекс Телемосте.
- `db` — Drizzle provider для MySQL.

## Проверка

Из корня проекта:

```bash
npm run check
```
