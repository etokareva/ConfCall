import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ApiErrorResponseBody {
  statusCode: number;
  error: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
}

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  'booking.cancel_not_found': 'booking.cancel_not_found',
  'Booking link not found': 'booking.link_not_found',
  'Booking link inactive': 'booking.link_inactive',
  Forbidden: 'common.forbidden',
  'Group not found': 'group.not_found',
  'Invitation not found': 'group.invitation_not_found',
  'Invalid auth token': 'auth.token_invalid',
  'Link not found': 'booking.link_not_found',
  'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and MAIL_FROM.':
    'auth.smtp_not_configured',
  'Service Unavailable': 'common.check_data_retry',
  'User not found': 'group.user_not_found',
  'Встречу можно создать только с участниками выбранной группы.':
    'meeting.group_member_mismatch',
  'Выберите корректную дату встречи': 'availability.intersection.invalid_date',
  'Выберите хотя бы одного участника':
    'availability.intersection.choose_participants',
  'Выбранное время уже занято другой встречей. Обновите варианты и выберите свободный слот.':
    'meeting.time_conflict',
  'Доступ запрещён': 'meeting.forbidden',
  'Доступна только участникам группы': 'group.member_only',
  'Не все пользователи имеют доступность на этот день':
    'availability.intersection.no_availability',
  'Неверный email или пароль': 'auth.invalid_credentials',
  'Приглашение можно принять только с указанного email': 'group.email_mismatch',
  'Приглашение недействительно или отправлено на другой email':
    'auth.invite_invalid',
  'Ссылка подтверждения недействительна или устарела':
    'auth.verify_link_invalid',
  'Ссылка приглашения недействительна': 'group.invitation_invalid',
  'Ссылка сброса пароля недействительна или устарела':
    'auth.reset_link_invalid',
  'Укажите название группы': 'group.name_required',
  'Укажите хотя бы один email': 'group.emails_required',
  'Управлять участниками может владелец группы': 'group.owner_only',
  'Это время уже занято другой встречей. Обновите страницу и выберите свободный слот.':
    'booking.conflict',
  'Яндекс Телемост не настроен: добавьте TELEMOST_OAUTH_TOKEN в .env':
    'video.telemost.not_configured',
  'Яндекс Телемост не принял токен авторизации. Проверьте, что в TELEMOST_OAUTH_TOKEN указан OAuth access token с правом telemost-api:conferences.create, а не Client ID или Client Secret.':
    'video.telemost.invalid_token',
  'Яндекс Телемост отклонил параметры создания конференции.':
    'video.telemost.invalid_request',
  'У токена Яндекс Телемоста нет доступа к созданию конференций. Нужен OAuth scope telemost-api:conferences.create и аккаунт Яндекс 360 для бизнеса.':
    'video.telemost.forbidden',
  'Не удалось создать учётную запись': 'auth.account_create_failed',
  'Пользователь с таким email уже зарегистрирован. Войдите в аккаунт и откройте приглашение снова.':
    'auth.email_exists',
};

function extractMessageKey(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'common.check_data_retry';
  }

  const payload = body as Record<string, unknown>;

  const directKey = payload.messageKey;
  if (typeof directKey === 'string' && directKey.trim()) {
    return directKey;
  }

  const message = payload.message;
  if (message && typeof message === 'object') {
    const nestedKey = (message as Record<string, unknown>).messageKey;
    if (typeof nestedKey === 'string' && nestedKey.trim()) {
      return nestedKey;
    }
  }

  if (typeof message === 'string' && message.trim()) {
    return ERROR_MESSAGE_KEYS[message] ?? 'common.check_data_retry';
  }

  if (Array.isArray(message) && message.length > 0) {
    return 'common.check_data_retry';
  }

  return 'common.check_data_retry';
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response
        .status(status)
        .json(this.buildBody(status, exception.name, body));
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(this.buildBody(HttpStatus.INTERNAL_SERVER_ERROR, 'Error', null));
  }

  private buildBody(
    statusCode: number,
    error: string,
    body: unknown,
  ): ApiErrorResponseBody {
    const messageKey = extractMessageKey(body);
    const messageParams = this.extractMessageParams(body);

    return {
      statusCode,
      error,
      messageKey,
      ...(messageParams ? { messageParams } : {}),
    };
  }

  private extractMessageParams(
    body: unknown,
  ): Record<string, string | number> | undefined {
    if (!body || typeof body !== 'object') {
      return undefined;
    }

    const payload = body as Record<string, unknown>;
    const message = payload.message;

    const params =
      (payload.messageParams as Record<string, string | number> | undefined) ??
      (message && typeof message === 'object'
        ? ((message as Record<string, unknown>).messageParams as
            | Record<string, string | number>
            | undefined)
        : undefined);

    return params;
  }
}
