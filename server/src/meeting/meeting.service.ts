import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { and, eq, gt, inArray, isNull, lt } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE_TOKEN } from '../db/db.module';
import * as schema from '../../../db/schema';
import { CreateMeetingDto } from './dto/meeting.dto';
import { VideoService } from '../video/video.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class MeetingService {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: MySql2Database<typeof schema>,
    private readonly video: VideoService,
    private readonly email: EmailService,
  ) {}

  async create(organizerId: number, dto: CreateMeetingDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const normalizedEmails = dto.participantEmails.map((email) =>
      email.trim().toLowerCase(),
    );
    const knownUsers = normalizedEmails.length
      ? await this.db
          .select({
            id: schema.users.id,
            email: schema.users.email,
          })
          .from(schema.users)
          .where(inArray(schema.users.email, normalizedEmails))
      : [];
    const userByEmail = new Map(
      knownUsers
        .filter((user) => user.email)
        .map((user) => [user.email!.toLowerCase(), user.id]),
    );
    const participantUserIds = [...userByEmail.values()];
    if (dto.groupId) {
      await this.ensureUsersInGroup(
        dto.groupId,
        [organizerId, ...participantUserIds],
        normalizedEmails.length,
        knownUsers.length,
      );
    }
    await this.ensureUsersAvailable(
      [organizerId, ...participantUserIds],
      startTime,
      endTime,
    );

    const videoMeeting = await this.video.createMeeting(
      dto.title,
      startTime,
      endTime,
    );
    const [meeting] = await this.db.insert(schema.meetings).values({
      organizerId,
      title: dto.title,
      description: dto.description,
      startTime,
      endTime,
      videoPlatform: (dto.videoPlatform as any) || 'telemost',
      videoUrl: videoMeeting.joinUrl,
      videoMeetingId: videoMeeting.id,
      status: 'scheduled',
    });
    const mId = Number(meeting.insertId);

    await this.db.insert(schema.meetingParticipants).values(
      normalizedEmails.map((email, i) => ({
        meetingId: mId,
        userId: userByEmail.get(email) ?? null,
        email,
        name: dto.participantNames?.[i] || null,
        status: 'confirmed' as const,
      })),
    );
    const createdMeeting = await this.getMeetingWithParticipants(mId);
    await this.notifyMeetingParticipants(createdMeeting, 'created');
    return createdMeeting;
  }

  async getMyMeetings(userId: number) {
    const organized = await this.db
      .select()
      .from(schema.meetings)
      .where(eq(schema.meetings.organizerId, userId))
      .orderBy(schema.meetings.startTime);
    const parts = await this.db
      .select({ meetingId: schema.meetingParticipants.meetingId })
      .from(schema.meetingParticipants)
      .where(eq(schema.meetingParticipants.userId, userId));
    const ids = parts
      .map((p) => p.meetingId)
      .filter((id): id is number => id !== null);
    let participated: typeof organized = [];
    if (ids.length)
      participated = await this.db
        .select()
        .from(schema.meetings)
        .where(inArray(schema.meetings.id, ids))
        .orderBy(schema.meetings.startTime);
    const all = [...organized, ...participated].filter(
      (m, i, a) => a.findIndex((t) => t.id === m.id) === i,
    );
    return Promise.all(
      all.map(async (m) => {
        const participants = await this.db
          .select()
          .from(schema.meetingParticipants)
          .where(eq(schema.meetingParticipants.meetingId, m.id));
        const isNew = participants.some(
          (participant) =>
            participant.userId === userId &&
            participant.seenAt === null &&
            m.status === 'scheduled',
        );

        return { ...m, participants, isNew };
      }),
    );
  }

  async markSeen(userId: number) {
    await this.db
      .update(schema.meetingParticipants)
      .set({ seenAt: new Date() })
      .where(
        and(
          eq(schema.meetingParticipants.userId, userId),
          isNull(schema.meetingParticipants.seenAt),
        ),
      );

    return { ok: true };
  }

  async cancel(userId: number, id: number) {
    const [m] = await this.db
      .select()
      .from(schema.meetings)
      .where(eq(schema.meetings.id, id))
      .limit(1);
    if (!m || m.organizerId !== userId)
      throw new ForbiddenException('Доступ запрещён');
    const [user] = await this.db
      .select({
        email: schema.users.email,
        name: schema.users.name,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    await this.db
      .update(schema.meetings)
      .set({
        status: 'cancelled',
        cancelledByName: user?.name || user?.email || 'Organizer',
        cancelledByEmail: user?.email || null,
        cancelledAt: new Date(),
      })
      .where(eq(schema.meetings.id, id));
    const cancelledMeeting = await this.getMeetingWithParticipants(id);
    await this.notifyMeetingParticipants(
      cancelledMeeting,
      'cancelled',
      user?.name || user?.email || null,
    );
    return cancelledMeeting;
  }

  async decline(userId: number, id: number) {
    const [meeting] = await this.db
      .select()
      .from(schema.meetings)
      .where(eq(schema.meetings.id, id))
      .limit(1);
    if (!meeting || meeting.status !== 'scheduled')
      throw new BadRequestException('Встреча недоступна для отказа');

    const [participant] = await this.db
      .select({
        id: schema.meetingParticipants.id,
      })
      .from(schema.meetingParticipants)
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, id),
          eq(schema.meetingParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (!participant) throw new ForbiddenException('Доступ запрещён');

    await this.db
      .update(schema.meetingParticipants)
      .set({ status: 'declined' })
      .where(eq(schema.meetingParticipants.id, participant.id));

    const updatedMeeting = await this.getMeetingWithParticipants(id);
    const [user] = await this.db
      .select({
        email: schema.users.email,
        name: schema.users.name,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    await this.notifyMeetingParticipants(
      updatedMeeting,
      'declined',
      user?.name || user?.email || null,
    );
    return updatedMeeting;
  }

  private async getMeetingWithParticipants(id: number) {
    const [meeting] = await this.db
      .select()
      .from(schema.meetings)
      .where(eq(schema.meetings.id, id))
      .limit(1);
    const participants = await this.db
      .select()
      .from(schema.meetingParticipants)
      .where(eq(schema.meetingParticipants.meetingId, id));

    return { ...meeting, participants };
  }

  private async notifyMeetingParticipants(
    meeting: Awaited<ReturnType<MeetingService['getMeetingWithParticipants']>>,
    action: 'created' | 'cancelled' | 'declined',
    actorName?: string | null,
  ) {
    const recipients = new Map<
      string,
      { email: string; name: string | null }
    >();
    for (const participant of meeting.participants) {
      if (participant.email) {
        recipients.set(participant.email.toLowerCase(), {
          email: participant.email,
          name: participant.name,
        });
      }
    }

    await Promise.allSettled(
      [...recipients.values()].map((recipient) =>
        this.email.sendMeetingNotificationEmail({
          email: recipient.email,
          name: recipient.name,
          meetingTitle: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          videoUrl: meeting.videoUrl,
          action,
          actorName,
        }),
      ),
    );
  }

  private async ensureUsersAvailable(
    userIds: number[],
    startTime: Date,
    endTime: Date,
  ) {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) return;

    const overlappingMeetings = await this.db
      .select({
        id: schema.meetings.id,
        organizerId: schema.meetings.organizerId,
      })
      .from(schema.meetings)
      .where(
        and(
          eq(schema.meetings.status, 'scheduled'),
          lt(schema.meetings.startTime, endTime),
          gt(schema.meetings.endTime, startTime),
        ),
      );

    if (overlappingMeetings.length === 0) return;

    const meetingIds = overlappingMeetings
      .map((meeting) => meeting.id)
      .filter((id): id is number => id !== null);
    const participants = await this.db
      .select({
        meetingId: schema.meetingParticipants.meetingId,
      })
      .from(schema.meetingParticipants)
      .where(
        and(
          inArray(schema.meetingParticipants.meetingId, meetingIds),
          inArray(schema.meetingParticipants.userId, uniqueUserIds),
          inArray(schema.meetingParticipants.status, ['pending', 'confirmed']),
        ),
      );
    const participantMeetingIds = new Set(
      participants.map((participant) => participant.meetingId),
    );
    const hasConflict = overlappingMeetings.some(
      (meeting) =>
        uniqueUserIds.includes(meeting.organizerId) ||
        participantMeetingIds.has(meeting.id),
    );

    if (hasConflict) {
      throw new BadRequestException(
        'Выбранное время уже занято другой встречей. Обновите варианты и выберите свободный слот.',
      );
    }
  }

  private async ensureUsersInGroup(
    groupId: number,
    userIds: number[],
    requestedEmailCount: number,
    knownUserCount: number,
  ) {
    if (requestedEmailCount !== knownUserCount) {
      throw new BadRequestException(
        'Выберите участников из группы. Один из email не найден среди зарегистрированных пользователей.',
      );
    }

    const uniqueUserIds = [...new Set(userIds)];
    const memberships = await this.db
      .select({
        userId: schema.groupMembers.userId,
      })
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          inArray(schema.groupMembers.userId, uniqueUserIds),
        ),
      );

    if (memberships.length !== uniqueUserIds.length) {
      throw new BadRequestException(
        'Встречу можно создать только с участниками выбранной группы.',
      );
    }
  }
}
