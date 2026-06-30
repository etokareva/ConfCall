import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

interface EmailCommonInput {
  email: string;
  name?: string | null;
}

interface VerificationEmailInput extends EmailCommonInput {
  verificationUrl: string;
}

interface PasswordResetEmailInput extends EmailCommonInput {
  resetUrl: string;
}

interface GroupInvitationEmailInput extends EmailCommonInput {
  groupName: string;
  inviteUrl: string;
}

interface PublicBookingLinkEmailInput extends EmailCommonInput {
  bookingUrl: string;
  groupName: string;
}

interface PublicBookingConfirmationEmailInput extends EmailCommonInput {
  cancelUrl: string;
  endTime: Date;
  meetingTitle: string;
  startTime: Date;
  videoUrl: string | null;
}

interface MeetingNotificationEmailInput extends EmailCommonInput {
  action: 'created' | 'cancelled' | 'declined';
  actorName?: string | null;
  endTime: Date;
  meetingTitle: string;
  startTime: Date;
  videoUrl?: string | null;
}

interface MailSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

@Injectable()
export class EmailService {
  private transporter?: Transporter<SMTPTransport.SentMessageInfo>;

  async sendVerificationEmail(input: VerificationEmailInput) {
    const settings = this.readSettings();
    const transporter = this.getTransporter(settings);
    const displayName = input.name?.trim() || input.email;
    const subject = 'ConfCall Scheduler: confirm your email';
    const copy = {
      title: 'Confirm your email',
      subtitle:
        'Activate your account and finish registration by opening the link below.',
      titleRu: 'Подтвердите email',
      subtitleRu:
        'Активируйте учётную запись и завершите регистрацию по ссылке ниже.',
      cta: 'Confirm email',
      ctaRu: 'Подтвердить email',
      note: 'If you did not request this registration, you can ignore this message.',
      noteRu:
        'Если вы не запрашивали регистрацию, просто проигнорируйте это письмо.',
    };
    const text = this.buildText({
      displayName,
      primaryLine: copy.subtitle,
      primaryLineRu: copy.subtitleRu,
      actionLabel: copy.cta,
      actionLabelRu: copy.ctaRu,
      url: input.verificationUrl,
      footerNote: copy.note,
      footerNoteRu: copy.noteRu,
    });

    await transporter.sendMail({
      from: settings.from,
      to: input.email,
      subject,
      text,
      html: this.buildHtml({
        brand: 'ConfCall Scheduler',
        displayName,
        title: copy.title,
        titleRu: copy.titleRu,
        subtitle: copy.subtitle,
        subtitleRu: copy.subtitleRu,
        actionLabel: copy.cta,
        actionLabelRu: copy.ctaRu,
        url: input.verificationUrl,
        footerNote: copy.note,
        footerNoteRu: copy.noteRu,
        accent: '#4f46e5',
      }),
    });
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    const settings = this.readSettings();
    const transporter = this.getTransporter(settings);
    const displayName = input.name?.trim() || input.email;
    const subject = 'ConfCall Scheduler: reset your password';
    const copy = {
      title: 'Reset your password',
      subtitle:
        'Create a new password and continue signing in to ConfCall Scheduler.',
      titleRu: 'Сброс пароля',
      subtitleRu:
        'Задайте новый пароль и продолжайте входить в ConfCall Scheduler.',
      cta: 'Set new password',
      ctaRu: 'Задать новый пароль',
      note: 'If you did not request a password reset, you can ignore this message.',
      noteRu:
        'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.',
    };
    const text = this.buildText({
      displayName,
      primaryLine: copy.subtitle,
      primaryLineRu: copy.subtitleRu,
      actionLabel: copy.cta,
      actionLabelRu: copy.ctaRu,
      url: input.resetUrl,
      footerNote: copy.note,
      footerNoteRu: copy.noteRu,
    });

    await transporter.sendMail({
      from: settings.from,
      to: input.email,
      subject,
      text,
      html: this.buildHtml({
        brand: 'ConfCall Scheduler',
        displayName,
        title: copy.title,
        titleRu: copy.titleRu,
        subtitle: copy.subtitle,
        subtitleRu: copy.subtitleRu,
        actionLabel: copy.cta,
        actionLabelRu: copy.ctaRu,
        url: input.resetUrl,
        footerNote: copy.note,
        footerNoteRu: copy.noteRu,
        accent: '#0f766e',
      }),
    });
  }

  async sendGroupInvitationEmail(input: GroupInvitationEmailInput) {
    const settings = this.readSettings();
    const transporter = this.getTransporter(settings);
    const displayName = input.name?.trim() || input.email;
    const subject = 'ConfCall Scheduler: invitation to join a group';
    const copy = {
      title: 'You were invited to a group',
      subtitle:
        'Open the link below to join the group and continue registration if you do not have an account yet.',
      titleRu: 'Вас пригласили в группу',
      subtitleRu:
        'Откройте ссылку ниже, чтобы присоединиться к группе и при необходимости завершить регистрацию.',
      cta: 'Join group',
      ctaRu: 'Присоединиться к группе',
      note: 'If you were not expecting this invitation, you can ignore this message.',
      noteRu:
        'Если вы не ожидали это приглашение, просто проигнорируйте письмо.',
    };
    const text = this.buildText({
      displayName,
      primaryLine: `${copy.subtitle} Group: ${input.groupName}.`,
      primaryLineRu: `${copy.subtitleRu} Группа: ${input.groupName}.`,
      actionLabel: copy.cta,
      actionLabelRu: copy.ctaRu,
      url: input.inviteUrl,
      footerNote: copy.note,
      footerNoteRu: copy.noteRu,
    });

    await transporter.sendMail({
      from: settings.from,
      to: input.email,
      subject,
      text,
      html: this.buildHtml({
        brand: 'ConfCall Scheduler',
        displayName,
        title: copy.title,
        titleRu: copy.titleRu,
        subtitle: `${copy.subtitle} Group: ${input.groupName}.`,
        subtitleRu: `${copy.subtitleRu} Группа: ${input.groupName}.`,
        actionLabel: copy.cta,
        actionLabelRu: copy.ctaRu,
        url: input.inviteUrl,
        footerNote: copy.note,
        footerNoteRu: copy.noteRu,
        accent: '#2563eb',
      }),
    });
  }

  async sendPublicBookingLinkEmail(input: PublicBookingLinkEmailInput) {
    const settings = this.readSettings();
    const transporter = this.getTransporter(settings);
    const displayName = input.name?.trim() || input.email;
    const subject = 'ConfCall Scheduler: choose a meeting time';
    const copy = {
      title: 'Choose a meeting time',
      subtitle:
        'Open the link below to see when the group is available and book a video call. You do not need an account.',
      titleRu: 'Выберите время встречи',
      subtitleRu:
        'Откройте ссылку ниже, чтобы увидеть общую доступность группы и забронировать видеозвонок. Аккаунт не нужен.',
      cta: 'Book a call',
      ctaRu: 'Забронировать звонок',
      note: 'If you were not expecting this invitation, you can ignore this message.',
      noteRu:
        'Если вы не ожидали это приглашение, просто проигнорируйте письмо.',
    };
    const text = this.buildText({
      displayName,
      primaryLine: `${copy.subtitle} Group: ${input.groupName}.`,
      primaryLineRu: `${copy.subtitleRu} Группа: ${input.groupName}.`,
      actionLabel: copy.cta,
      actionLabelRu: copy.ctaRu,
      url: input.bookingUrl,
      footerNote: copy.note,
      footerNoteRu: copy.noteRu,
    });

    await transporter.sendMail({
      from: settings.from,
      to: input.email,
      subject,
      text,
      html: this.buildHtml({
        brand: 'ConfCall Scheduler',
        displayName,
        title: copy.title,
        titleRu: copy.titleRu,
        subtitle: `${copy.subtitle} Group: ${input.groupName}.`,
        subtitleRu: `${copy.subtitleRu} Группа: ${input.groupName}.`,
        actionLabel: copy.cta,
        actionLabelRu: copy.ctaRu,
        url: input.bookingUrl,
        footerNote: copy.note,
        footerNoteRu: copy.noteRu,
        accent: '#0f766e',
      }),
    });
  }

  async sendPublicBookingConfirmationEmail(
    input: PublicBookingConfirmationEmailInput,
  ) {
    const settings = this.readSettings();
    const transporter = this.getTransporter(settings);
    const displayName = input.name?.trim() || input.email;
    const subject = `ConfCall Scheduler: ${input.meetingTitle}`;
    const timeText = this.formatMeetingTime(input.startTime, input.endTime);
    const videoLine = input.videoUrl
      ? `Video call link: ${input.videoUrl}`
      : 'The video call link will be available in the meeting details.';
    const videoLineRu = input.videoUrl
      ? `Ссылка на видеозвонок: ${input.videoUrl}`
      : 'Ссылка на видеозвонок будет доступна в деталях встречи.';
    const copy = {
      title: 'Meeting booked',
      subtitle: `${input.meetingTitle}. ${timeText}. ${videoLine}`,
      titleRu: 'Встреча забронирована',
      subtitleRu: `${input.meetingTitle}. ${timeText}. ${videoLineRu}`,
      cta: 'Open video call',
      ctaRu: 'Открыть видеозвонок',
      note: `If you cannot attend, cancel the meeting here: ${input.cancelUrl}`,
      noteRu: `Если вы не сможете участвовать, отмените встречу по ссылке: ${input.cancelUrl}`,
    };
    const actionUrl = input.videoUrl || input.cancelUrl;
    const text = this.buildText({
      displayName,
      primaryLine: copy.subtitle,
      primaryLineRu: copy.subtitleRu,
      actionLabel: copy.cta,
      actionLabelRu: copy.ctaRu,
      url: actionUrl,
      footerNote: copy.note,
      footerNoteRu: copy.noteRu,
    });

    await transporter.sendMail({
      from: settings.from,
      to: input.email,
      subject,
      text,
      html: this.buildHtml({
        brand: 'ConfCall Scheduler',
        displayName,
        title: copy.title,
        titleRu: copy.titleRu,
        subtitle: copy.subtitle,
        subtitleRu: copy.subtitleRu,
        actionLabel: copy.cta,
        actionLabelRu: copy.ctaRu,
        url: actionUrl,
        footerNote: copy.note,
        footerNoteRu: copy.noteRu,
        accent: '#0f766e',
      }),
    });
  }

  async sendMeetingNotificationEmail(input: MeetingNotificationEmailInput) {
    const settings = this.readSettings();
    const transporter = this.getTransporter(settings);
    const displayName = input.name?.trim() || input.email;
    const timeText = this.formatMeetingTime(input.startTime, input.endTime);
    const actor = input.actorName?.trim();
    const actionCopy = {
      created: {
        title: 'Meeting scheduled',
        titleRu: 'Встреча запланирована',
        cta: 'Open video call',
        ctaRu: 'Открыть видеозвонок',
      },
      cancelled: {
        title: 'Meeting cancelled',
        titleRu: 'Встреча отменена',
        cta: 'View meeting',
        ctaRu: 'Посмотреть встречу',
      },
      declined: {
        title: 'Participant declined',
        titleRu: 'Участник отказался от встречи',
        cta: 'View meeting',
        ctaRu: 'Посмотреть встречу',
      },
    }[input.action];
    const actorLine = actor ? ` Actor: ${actor}.` : '';
    const actorLineRu = actor ? ` Инициатор: ${actor}.` : '';
    const videoLine = input.videoUrl ? ` Link: ${input.videoUrl}.` : '';
    const videoLineRu = input.videoUrl ? ` Ссылка: ${input.videoUrl}.` : '';
    const url = input.videoUrl || this.appUrl();

    await transporter.sendMail({
      from: settings.from,
      to: input.email,
      subject: `ConfCall Scheduler: ${actionCopy.title}`,
      text: this.buildText({
        displayName,
        primaryLine: `${input.meetingTitle}. ${timeText}.${actorLine}${videoLine}`,
        primaryLineRu: `${input.meetingTitle}. ${timeText}.${actorLineRu}${videoLineRu}`,
        actionLabel: actionCopy.cta,
        actionLabelRu: actionCopy.ctaRu,
        url,
        footerNote: 'This notification was sent because the meeting changed.',
        footerNoteRu:
          'Это уведомление отправлено, потому что встреча изменилась.',
      }),
      html: this.buildHtml({
        brand: 'ConfCall Scheduler',
        displayName,
        title: actionCopy.title,
        titleRu: actionCopy.titleRu,
        subtitle: `${input.meetingTitle}. ${timeText}.${actorLine}${videoLine}`,
        subtitleRu: `${input.meetingTitle}. ${timeText}.${actorLineRu}${videoLineRu}`,
        actionLabel: actionCopy.cta,
        actionLabelRu: actionCopy.ctaRu,
        url,
        footerNote: 'This notification was sent because the meeting changed.',
        footerNoteRu:
          'Это уведомление отправлено, потому что встреча изменилась.',
        accent: '#0f766e',
      }),
    });
  }

  private buildText(input: {
    displayName: string;
    primaryLine: string;
    primaryLineRu: string;
    actionLabel: string;
    actionLabelRu: string;
    url: string;
    footerNote: string;
    footerNoteRu: string;
  }) {
    return [
      `Hello, ${input.displayName}.`,
      '',
      input.primaryLine,
      input.url,
      '',
      `Здравствуйте, ${input.displayName}.`,
      '',
      input.primaryLineRu,
      input.url,
      '',
      input.actionLabel,
      input.actionLabelRu,
      '',
      input.footerNote,
      input.footerNoteRu,
    ].join('\n');
  }

  private buildHtml(input: {
    brand: string;
    displayName: string;
    title: string;
    titleRu: string;
    subtitle: string;
    subtitleRu: string;
    actionLabel: string;
    actionLabelRu: string;
    url: string;
    footerNote: string;
    footerNoteRu: string;
    accent: string;
  }) {
    const escapedUrl = this.escapeHtml(input.url);
    const escapedBrand = this.escapeHtml(input.brand);
    const escapedName = this.escapeHtml(input.displayName);
    const escapedTitle = this.escapeHtml(input.title);
    const escapedTitleRu = this.escapeHtml(input.titleRu);
    const escapedSubtitle = this.escapeHtml(input.subtitle);
    const escapedSubtitleRu = this.escapeHtml(input.subtitleRu);
    const escapedActionLabel = this.escapeHtml(input.actionLabel);
    const escapedActionLabelRu = this.escapeHtml(input.actionLabelRu);
    const escapedFooterNote = this.escapeHtml(input.footerNote);
    const escapedFooterNoteRu = this.escapeHtml(input.footerNoteRu);

    return `
      <div style="margin:0;padding:0;background:#f3f4f6">
        <div style="max-width:640px;margin:0 auto;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#111827">
          <div style="padding:24px;border-radius:20px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(15,23,42,0.08)">
            <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:${input.accent}14;color:${input.accent};font-size:12px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase">
              ${escapedBrand}
            </div>
            <div style="margin-top:20px;padding:16px 18px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0">
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#475569">Hello, ${escapedName}.</p>
              <h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:#0f172a">${escapedTitle}</h1>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#334155">${escapedSubtitle}</p>
              <div style="margin:18px 0 0">
                <a href="${escapedUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:${input.accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">
                  ${escapedActionLabel}
                </a>
              </div>
              <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#64748b">If the button does not work, open this link:</p>
              <p style="margin:4px 0 0;word-break:break-all;font-size:13px;line-height:1.6"><a href="${escapedUrl}" style="color:${input.accent};text-decoration:underline">${escapedUrl}</a></p>
            </div>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#475569">Здравствуйте, ${escapedName}.</p>
              <h2 style="margin:0 0 8px;font-size:20px;line-height:1.25;color:#0f172a">${escapedTitleRu}</h2>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#334155">${escapedSubtitleRu}</p>
              <div style="margin:18px 0 0">
                <a href="${escapedUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:${input.accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">
                  ${escapedActionLabelRu}
                </a>
              </div>
              <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#64748b">${escapedFooterNoteRu}</p>
              <p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:#64748b">${escapedFooterNote}</p>
            </div>
          </div>
          <p style="margin:16px 0 0;text-align:center;font-size:12px;line-height:1.6;color:#94a3b8">
            ConfCall Scheduler
          </p>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private formatMeetingTime(startTime: Date, endTime: Date) {
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
    const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });

    return `${formatter.format(startTime)} - ${timeFormatter.format(endTime)}`;
  }

  private getTransporter(settings: MailSettings) {
    if (!this.transporter) {
      this.transporter = createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: {
          user: settings.user,
          pass: settings.pass,
        },
      });
    }

    return this.transporter;
  }

  private readSettings(): MailSettings {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = (process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true';
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.MAIL_FROM?.trim();

    if (!host || !Number.isInteger(port) || !user || !pass || !from) {
      throw new InternalServerErrorException({
        messageKey: 'auth.smtp_not_configured',
      });
    }

    return { host, port, secure, user, pass, from };
  }

  private appUrl() {
    return process.env.APP_PUBLIC_URL || 'http://127.0.0.1:4200';
  }
}
