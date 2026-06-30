import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, gt, inArray, lt, or } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { nanoid } from 'nanoid';
import { DRIZZLE_TOKEN } from '../db/db.module';
import * as schema from '../../../db/schema';
import {
  CreateBookingLinkDto,
  BookSlotDto,
  SendBookingLinkDto,
} from './dto/booking.dto';
import { VideoService } from '../video/video.service';
import { EmailService } from '../auth/email.service';
import {
  AvailableSlot,
  IntersectionResponse,
} from '../availability/dto/availability.dto';

@Injectable()
export class BookingService {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: MySql2Database<typeof schema>,
    private readonly video: VideoService,
    private readonly email: EmailService,
  ) {}

  async createLink(userId: number, dto: CreateBookingLinkDto) {
    await this.ensureUserInGroup(userId, dto.groupId);
    await this.ensureUsersInGroup(dto.groupId, dto.participantIds);
    const slug = nanoid(10);
    const [created] = await this.db.insert(schema.bookingLinks).values({
      userId,
      groupId: dto.groupId,
      slug,
      title: dto.title || 'Забронировать встречу',
      description: dto.description,
      durationMinutes: dto.durationMinutes || 30,
      isActive: true,
    });
    const bookingLinkId = Number(created.insertId);
    await this.db.insert(schema.bookingLinkParticipants).values(
      [...new Set(dto.participantIds)].map((participantId) => ({
        bookingLinkId,
        userId: participantId,
      })),
    );
    const [link] = await this.db
      .select()
      .from(schema.bookingLinks)
      .where(eq(schema.bookingLinks.slug, slug))
      .limit(1);

    return link;
  }

  async getMyLinks(userId: number) {
    const memberships = await this.db
      .select({ groupId: schema.groupMembers.groupId })
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.userId, userId));
    const groupIds = memberships.map((membership) => membership.groupId);
    const where =
      groupIds.length > 0
        ? or(
            eq(schema.bookingLinks.userId, userId),
            inArray(schema.bookingLinks.groupId, groupIds),
          )
        : eq(schema.bookingLinks.userId, userId);

    return this.db
      .select()
      .from(schema.bookingLinks)
      .where(where)
      .orderBy(schema.bookingLinks.createdAt);
  }

  async deleteLink(userId: number, id: number) {
    await this.ensureUserCanUseLink(userId, id);
    await this.db
      .delete(schema.bookingLinkParticipants)
      .where(eq(schema.bookingLinkParticipants.bookingLinkId, id));
    await this.db
      .delete(schema.bookingLinks)
      .where(eq(schema.bookingLinks.id, id));
    return { id };
  }

  async toggleLink(userId: number, id: number) {
    const link = await this.ensureUserCanUseLink(userId, id);
    const isActive = !link.isActive;
    await this.db
      .update(schema.bookingLinks)
      .set({ isActive })
      .where(eq(schema.bookingLinks.id, id));
    const [updated] = await this.db
      .select()
      .from(schema.bookingLinks)
      .where(eq(schema.bookingLinks.id, id))
      .limit(1);
    return updated;
  }

  async sendLink(userId: number, id: number, dto: SendBookingLinkDto) {
    const link = await this.ensureUserCanUseLink(userId, id);
    if (!link || !link.isActive) throw new NotFoundException('Link not found');
    if (!link.groupId) throw new BadRequestException('booking.group_required');

    const context = await this.getGroupContext(link.groupId);
    const email = dto.email.trim().toLowerCase();

    await this.email.sendPublicBookingLinkEmail({
      email,
      groupName: context.group?.name ?? link.title,
      bookingUrl: `${this.appUrl()}/book/${link.slug}`,
    });

    return { email };
  }

  async getBySlug(slug: string) {
    const context = await this.getLinkContext(slug);
    return {
      link: context.link,
      host: context.host,
      group: context.group
        ? {
            ...context.group.group,
            members: context.participants.map((participant) => ({
              id: participant.userId,
              email: participant.email,
              name: participant.name,
              avatar: null,
            })),
          }
        : null,
    };
  }

  async getPublicIntersection(
    slug: string,
    date: string,
    durationMinutes?: number,
  ): Promise<IntersectionResponse> {
    const context = await this.getLinkContext(slug);
    return this.calculateIntersection(context.userIds, date, durationMinutes);
  }

  async bookSlot(dto: BookSlotDto) {
    const context = await this.getLinkContext(dto.slug);
    const guestEmail = dto.guestEmail.trim().toLowerCase();
    const guestName = dto.guestName.trim();
    const startTime = new Date(`${dto.date}T${dto.startTime}:00`);
    const endTime = new Date(`${dto.date}T${dto.endTime}:00`);
    await this.ensureUsersAvailable(context.userIds, startTime, endTime);

    const video = await this.video.createMeeting(dto.title, startTime, endTime);
    const [meeting] = await this.db.insert(schema.meetings).values({
      organizerId: context.link.userId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      startTime,
      endTime,
      videoPlatform: 'telemost',
      videoUrl: video.joinUrl,
      videoMeetingId: video.id,
      status: 'scheduled',
    });
    const mId = Number(meeting.insertId);
    const guestCancelToken = nanoid(32);
    const participants = [
      ...context.participants.map((participant) => ({
        meetingId: mId,
        userId: participant.userId,
        email: participant.email,
        name: participant.name,
        status: 'confirmed' as const,
        seenAt: null,
      })),
      {
        meetingId: mId,
        email: guestEmail,
        name: guestName,
        cancelToken: guestCancelToken,
        status: 'confirmed' as const,
      },
    ];
    await this.db.insert(schema.meetingParticipants).values(participants);
    await this.email.sendPublicBookingConfirmationEmail({
      email: guestEmail,
      name: guestName,
      meetingTitle: dto.title.trim(),
      startTime,
      endTime,
      videoUrl: video.joinUrl,
      cancelUrl: `${this.appUrl()}/book/cancel/${guestCancelToken}`,
    });
    await Promise.allSettled(
      context.participants
        .filter((participant) => participant.email)
        .map((participant) =>
          this.email.sendMeetingNotificationEmail({
            email: participant.email!,
            name: participant.name,
            meetingTitle: dto.title.trim(),
            startTime,
            endTime,
            videoUrl: video.joinUrl,
            action: 'created',
            actorName: guestName,
          }),
        ),
    );
    return { meetingId: mId, videoUrl: video.joinUrl };
  }

  async cancelByGuestToken(token: string) {
    const [participant] = await this.db
      .select()
      .from(schema.meetingParticipants)
      .where(eq(schema.meetingParticipants.cancelToken, token))
      .limit(1);

    if (!participant) throw new NotFoundException('booking.cancel_not_found');

    const [meeting] = await this.db
      .select()
      .from(schema.meetings)
      .where(eq(schema.meetings.id, participant.meetingId))
      .limit(1);

    if (!meeting) throw new NotFoundException('booking.cancel_not_found');
    if (meeting.status === 'cancelled') {
      return { ok: true, alreadyCancelled: true };
    }

    await this.db
      .update(schema.meetings)
      .set({
        status: 'cancelled',
        cancelledByName: participant.name || participant.email,
        cancelledByEmail: participant.email,
        cancelledAt: new Date(),
      })
      .where(eq(schema.meetings.id, participant.meetingId));
    const participants = await this.db
      .select()
      .from(schema.meetingParticipants)
      .where(eq(schema.meetingParticipants.meetingId, participant.meetingId));
    await Promise.allSettled(
      participants
        .filter((item) => item.email)
        .map((item) =>
          this.email.sendMeetingNotificationEmail({
            email: item.email,
            name: item.name,
            meetingTitle: meeting.title,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            videoUrl: meeting.videoUrl,
            action: 'cancelled',
            actorName: participant.name || participant.email,
          }),
        ),
    );

    return { ok: true, alreadyCancelled: false };
  }

  private async getLinkContext(slug: string) {
    const [link] = await this.db
      .select()
      .from(schema.bookingLinks)
      .where(eq(schema.bookingLinks.slug, slug))
      .limit(1);
    if (!link) throw new NotFoundException('Booking link not found');
    if (!link.isActive) {
      throw new GoneException('Booking link inactive');
    }
    const [host] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
      })
      .from(schema.users)
      .where(eq(schema.users.id, link.userId))
      .limit(1);
    const group = link.groupId
      ? await this.getGroupContext(link.groupId)
      : null;
    const selectedParticipants = await this.getBookingLinkParticipants(link.id);
    const userIds =
      selectedParticipants.length > 0
        ? selectedParticipants.map((member) => member.id)
        : group
          ? group.members.map((member) => member.id)
          : [link.userId];
    const participants =
      selectedParticipants.length > 0
        ? selectedParticipants.map((member) => ({
            userId: member.id,
            email: member.email,
            name: member.name,
          }))
        : group
          ? group.members.map((member) => ({
              userId: member.id,
              email: member.email,
              name: member.name,
            }))
          : [
              {
                userId: host.id,
                email: host.email,
                name: host.name,
              },
            ];
    return { link, host, group, userIds, participants };
  }

  private async ensureUsersAvailable(
    userIds: number[],
    startTime: Date,
    endTime: Date,
  ) {
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
          inArray(schema.meetingParticipants.userId, userIds),
          inArray(schema.meetingParticipants.status, ['pending', 'confirmed']),
        ),
      );
    const participantMeetingIds = new Set(
      participants.map((participant) => participant.meetingId),
    );
    if (participantMeetingIds.size > 0) {
      throw new BadRequestException(
        'Это время уже занято другой встречей. Обновите страницу и выберите свободный слот.',
      );
    }
  }

  private async ensureUserInGroup(userId: number, groupId: number) {
    const [membership] = await this.db
      .select({
        id: schema.groupMembers.id,
      })
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException('group.member_only');
    }
  }

  private async ensureUsersInGroup(groupId: number, userIds: number[]) {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) {
      throw new BadRequestException(
        'availability.intersection.choose_participants',
      );
    }

    const memberships = await this.db
      .select({ userId: schema.groupMembers.userId })
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          inArray(schema.groupMembers.userId, uniqueUserIds),
        ),
      );

    if (memberships.length !== uniqueUserIds.length) {
      throw new ForbiddenException('group.member_only');
    }
  }

  private async ensureUserCanUseLink(userId: number, id: number) {
    const [link] = await this.db
      .select()
      .from(schema.bookingLinks)
      .where(eq(schema.bookingLinks.id, id))
      .limit(1);
    if (!link) throw new NotFoundException('Link not found');
    if (!link.groupId) {
      if (link.userId !== userId) throw new NotFoundException('Link not found');
      return link;
    }

    await this.ensureUserInGroup(userId, link.groupId);
    return link;
  }

  private async getGroupContext(groupId: number) {
    const group = await this.db
      .select({
        id: schema.groups.id,
        name: schema.groups.name,
        avatar: schema.groups.avatar,
      })
      .from(schema.groups)
      .where(eq(schema.groups.id, groupId))
      .limit(1);
    const members = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
      })
      .from(schema.groupMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.groupMembers.userId))
      .where(eq(schema.groupMembers.groupId, groupId));

    return {
      group: group[0] ?? null,
      members,
    };
  }

  private async getBookingLinkParticipants(bookingLinkId: number) {
    return this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
      })
      .from(schema.bookingLinkParticipants)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.bookingLinkParticipants.userId),
      )
      .where(eq(schema.bookingLinkParticipants.bookingLinkId, bookingLinkId));
  }

  private async calculateIntersection(
    userIds: number[],
    date: string,
    durationMinutes?: number,
  ): Promise<IntersectionResponse> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return {
        availableSlots: [],
        availableRanges: [],
        messageKey: 'availability.intersection.choose_participants',
      };
    }

    const targetDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(targetDate.getTime())) {
      return {
        availableSlots: [],
        availableRanges: [],
        messageKey: 'availability.intersection.invalid_date',
      };
    }

    const dayOfWeek = targetDate.getDay();
    const slots = await this.db
      .select()
      .from(schema.availabilitySlots)
      .where(
        and(
          inArray(schema.availabilitySlots.userId, userIds),
          eq(schema.availabilitySlots.dayOfWeek, dayOfWeek),
          eq(schema.availabilitySlots.isActive, true),
        ),
      );
    const events = await this.db
      .select()
      .from(schema.availabilityCalendarEvents)
      .where(
        and(
          inArray(schema.availabilityCalendarEvents.userId, userIds),
          eq(schema.availabilityCalendarEvents.isActive, true),
        ),
      );
    const byUser = new Map<number, typeof slots>();
    for (const slot of slots) {
      if (!byUser.has(slot.userId)) byUser.set(slot.userId, []);
      byUser.get(slot.userId)?.push(slot);
    }
    const eventByUser = new Map<number, typeof events>();
    for (const event of events) {
      if (!eventByUser.has(event.userId)) eventByUser.set(event.userId, []);
      eventByUser.get(event.userId)?.push(event);
    }

    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);
    const existingMeetings = await this.db
      .select({
        id: schema.meetings.id,
        startTime: schema.meetings.startTime,
        endTime: schema.meetings.endTime,
        organizerId: schema.meetings.organizerId,
      })
      .from(schema.meetings)
      .where(
        and(
          eq(schema.meetings.status, 'scheduled'),
          lt(schema.meetings.startTime, dateEnd),
          gt(schema.meetings.endTime, dateStart),
        ),
      );
    const meetingIds = existingMeetings
      .map((meeting) => meeting.id)
      .filter((id): id is number => id !== null);
    let busyRanges: { start: number; end: number }[] = [];
    if (meetingIds.length > 0) {
      const parts = await this.db
        .select({
          meetingId: schema.meetingParticipants.meetingId,
        })
        .from(schema.meetingParticipants)
        .where(
          and(
            inArray(schema.meetingParticipants.meetingId, meetingIds),
            inArray(schema.meetingParticipants.userId, userIds),
            inArray(schema.meetingParticipants.status, [
              'pending',
              'confirmed',
            ]),
          ),
        );
      const partMeetingIds = new Set(parts.map((part) => part.meetingId));
      const relevantMeetings = existingMeetings.filter(
        (meeting) =>
          partMeetingIds.has(meeting.id) ||
          userIds.includes(meeting.organizerId),
      );
      busyRanges = relevantMeetings.map((meeting) => ({
        start: this.dateToMinutesInDay(meeting.startTime, dateStart, 'start'),
        end: this.dateToMinutesInDay(meeting.endTime, dateStart, 'end'),
      }));
    }

    const userRanges: { start: number; end: number }[][] = [];
    for (const userId of userIds) {
      const weeklyRanges = byUser.get(userId) ?? [];
      const calendarRanges = eventByUser.get(userId) ?? [];
      const ranges = [
        ...weeklyRanges.map((slot) => ({
          start: this.timeToMinutes(slot.startTime),
          end: this.timeToMinutes(slot.endTime),
        })),
        ...calendarRanges
          .filter((event) => this.calendarEventApplies(event, date))
          .map((event) => ({
            start: this.timeToMinutes(event.startTime),
            end: this.timeToMinutes(event.endTime),
          })),
      ];
      if (ranges.length === 0) {
        return {
          availableSlots: [],
          availableRanges: [],
          messageKey: 'availability.intersection.no_availability',
          unavailableUserIds: userIds,
        };
      }
      userRanges.push(ranges);
    }

    let common = userRanges[0];
    for (let i = 1; i < userRanges.length; i++) {
      common = this.intersectRanges(common, userRanges[i]);
      if (common.length === 0) break;
    }

    let free = common;
    for (const busy of busyRanges) free = this.subtractRanges(free, busy);
    const availableRanges = free.map((range) => ({
      start: this.minutesToTime(range.start),
      end: this.minutesToTime(range.end),
      durationMinutes: range.end - range.start,
    }));

    const availableSlots: AvailableSlot[] = [];
    if (typeof durationMinutes === 'number') {
      for (const range of free) {
        let cur = range.start;
        while (cur + durationMinutes <= range.end) {
          availableSlots.push({
            start: this.minutesToTime(cur),
            end: this.minutesToTime(cur + durationMinutes),
          });
          cur += durationMinutes;
        }
      }
    } else {
      for (const range of free) {
        availableSlots.push({
          start: this.minutesToTime(range.start),
          end: this.minutesToTime(range.end),
        });
      }
    }

    return {
      availableSlots,
      availableRanges,
      messageKey: availableSlots.length === 0 ? 'booking.conflict' : null,
    };
  }

  private timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number) {
    const hours = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }

  private dateToMinutesInDay(
    value: Date,
    dayStart: Date,
    boundary: 'start' | 'end',
  ) {
    const diff = (value.getTime() - dayStart.getTime()) / 60000;
    return boundary === 'start'
      ? Math.max(0, Math.round(diff))
      : Math.min(1440, Math.round(diff));
  }

  private intersectRanges(
    left: { start: number; end: number }[],
    right: { start: number; end: number }[],
  ) {
    const result: { start: number; end: number }[] = [];
    for (const a of left) {
      for (const b of right) {
        const start = Math.max(a.start, b.start);
        const end = Math.min(a.end, b.end);
        if (start < end) result.push({ start, end });
      }
    }
    return result;
  }

  private subtractRanges(
    base: { start: number; end: number }[],
    busy: { start: number; end: number },
  ) {
    const result: { start: number; end: number }[] = [];
    for (const range of base) {
      if (busy.end <= range.start || busy.start >= range.end) {
        result.push(range);
        continue;
      }
      if (busy.start > range.start) {
        result.push({
          start: range.start,
          end: Math.min(busy.start, range.end),
        });
      }
      if (busy.end < range.end) {
        result.push({ start: Math.max(busy.end, range.start), end: range.end });
      }
    }
    return result;
  }

  private calendarEventApplies(
    event: {
      startDate: string;
      endDate: string;
      repeatEveryDays: number;
    },
    date: string,
  ) {
    if (date < event.startDate || date > event.endDate) return false;
    const start = new Date(`${event.startDate}T00:00:00`);
    const current = new Date(`${date}T00:00:00`);
    const diff = Math.round((current.getTime() - start.getTime()) / 86400000);
    return diff % event.repeatEveryDays === 0;
  }

  private appUrl() {
    return (process.env.APP_URL || 'http://127.0.0.1:4200').replace(/\/$/, '');
  }
}
