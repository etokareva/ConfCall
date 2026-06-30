# Запуск проекта локально

Для AI-агентов: если задача требует проверки в браузере, сначала свериться с этим файлом. Если серверы уже запущены, не перезапускать без необходимости; если перезапуск нужен, явно указать это в ответе пользователю.

## Что должно быть установлено

- Node.js с npm
- Docker и Docker Compose

## Переменные окружения

В корне проекта должен быть файл `.env`.

Минимально:

```env
MYSQL_DATABASE=confcall_scheduler
MYSQL_USER=app_user
MYSQL_PASSWORD=change_me_mysql_password
MYSQL_ROOT_PASSWORD=change_me_mysql_root_password
DATABASE_URL=mysql://app_user:change_me_mysql_password@localhost:3306/confcall_scheduler
APP_PUBLIC_URL=http://127.0.0.1:4200
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mailer@example.com
SMTP_PASS=your_mail_password
MAIL_FROM="ConfCall Scheduler <mailer@example.com>"
```

Для создания реальных ссылок Яндекс Телемост:

```env
TELEMOST_OAUTH_TOKEN=ваш_oauth_access_token
```

Токен должен быть выпущен пользователем организации Яндекс 360 для бизнеса и иметь право `telemost-api:conferences.create`.

Для подтверждения email по SMTP через Яндекс Почту для домена:

```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mailer@example.com
SMTP_PASS=mailbox_or_app_password
MAIL_FROM="ConfCall Scheduler <mailer@example.com>"
APP_PUBLIC_URL=http://127.0.0.1:4200
```

Если почтовый ящик защищён двухфакторной аутентификацией, используйте пароль приложения.
`SMTP_USER` и `MAIL_FROM` должны указывать на реально существующий ящик или alias в Яндекс 360 для бизнеса.
Если письмо подтверждения не доходит, проверьте:

- что у домена настроены DNS-записи `MX`, `SPF` и `DKIM`;
- что ящик из `SMTP_USER` существует в Яндекс 360 для бизнеса или задан как alias;
- что письмо не попало в спам;
- что `SMTP_USER` и `MAIL_FROM` относятся к тому же домену.

## Первый запуск

Из корня проекта:

```bash
npm install
npm run db:up
npm run db:push
```

## Обычный запуск

Откройте два терминала в корне проекта.

Терминал 1, backend:

```bash
npm run dev:be
```

Backend будет доступен на:

```text
http://localhost:3000/
```

Терминал 2, frontend:

```bash
npm run dev:fe
```

Frontend будет доступен на:

```text
http://localhost:4200/
```

`npm run dev:be` уже выполняет три шага: поднимает MySQL через Docker Compose, применяет Drizzle schema и запускает backend. Отдельно выполнять `npm run db:up` перед каждым обычным запуском не обязательно.

## Если Docker требует sudo

Если команда `npm run dev:be` падает на доступе к Docker socket, сначала запустите MySQL вручную:

```bash
sudo docker compose up -d mysql
```

Потом запустите backend без шага Docker:

```bash
npm run db:push
npm run build:be
npm run start:be
```

## Проверка

Frontend:

```bash
curl -I http://127.0.0.1:4200/
```

Backend:

```bash
curl -i http://127.0.0.1:3000/api/auth/me
```

Ответ `401` от `/api/auth/me` нормален, если запрос без авторизационного токена.

## Скриншоты интерфейса через Playwright в Docker

Перед созданием скриншотов должны быть запущены backend и frontend:

```bash
npm run dev:be
npm run dev:fe
```

В отдельном терминале:

```bash
npm run ui:screenshot:docker
```

Команда запускает Playwright в Docker-контейнере и сохраняет PNG-файлы в:

```text
artifacts/screenshots/
```

Если нужен обычный e2e-запуск без сохранения только screenshot-сценария:

```bash
npm run e2e
```

Сейчас снимаются основные экраны:

- `login.png`
- `dashboard.png`
- `availability.png`
- `book.png`
- `meetings.png`
- `settings.png`

## Остановка

Backend и frontend останавливаются в своих терминалах через:

```text
Ctrl+C
```

Остановить MySQL:

```bash
npm run db:down
```
