import {
  ForbiddenException,
  Injectable,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { eq, and, gt, gte, inArray, lt, lte } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE_TOKEN } from '../db/db.module';
import * as schema from '../../../db/schema';
import {
  SetAvailabilityDto,
  SetCalendarEventsDto,
  GetIntersectionQueryDto,
  AvailableSlot,
  AvailableRange,
  CalendarEvent,
  DayIntersectionResponse,
  IntersectionResponse,
  RangeIntersectionResponse,
  AvailabilityRangeSource,
} from './dto/availability.dto';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';
import { Subscription } from 'rxjs';

interface RangeWithSources {
  start: number;
  end: number;
  sources: AvailabilityRangeSource[];
}

interface MeetingCandidate {
  id: number;
  startTime: Date;
  endTime: Date;
  organizerId: number;
}

interface BusyMeetingCandidates {
  meetingParticipants: schema.MeetingParticipant[];
  meetings: MeetingCandidate[];
}

interface IntersectionCandidates {
  calendarEvents: CalendarEvent[];
  meetingParticipants: schema.MeetingParticipant[];
  meetings: MeetingCandidate[];
  slots: schema.AvailabilitySlot[];
}

interface IntersectionCacheEntry {
  expiresAt: number;
  value: IntersectionResponse | RangeIntersectionResponse;
  version: number;
}

const DEFAULT_MAX_INTERSECTION_RANGE_DAYS = 31;
const INTERSECTION_CACHE_TTL_MS = 5000;

@Injectable()
export class AvailabilityService implements OnModuleInit, OnModuleDestroy {
  private readonly intersectionCache = new Map<
    string,
    IntersectionCacheEntry
  >();
  private cacheInvalidationSubscription?: Subscription;

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: MySql2Database<typeof schema>,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  onModuleInit() {
    this.cacheInvalidationSubscription =
      this.cacheInvalidation.intersectionInvalidated$.subscribe(() =>
        this.clearIntersectionCache(),
      );
  }

  onModuleDestroy() {
    this.cacheInvalidationSubscription?.unsubscribe();
  }

  async getMySlots(userId: number) {
    return this.db
      .select()
      .from(schema.availabilitySlots)
      .where(eq(schema.availabilitySlots.userId, userId))
      .orderBy(
        schema.availabilitySlots.dayOfWeek,
        schema.availabilitySlots.startTime,
      );
  }

  async setSlots(userId: number, dto: SetAvailabilityDto) {
    await this.db
      .delete(schema.availabilitySlots)
      .where(eq(schema.availabilitySlots.userId, userId));
    if (dto.slots.length > 0) {
      await this.db
        .insert(schema.availabilitySlots)
        .values(dto.slots.map((s) => ({ userId, ...s, isActive: true })));
    }
    await this.cacheInvalidation.invalidateIntersections();
    return this.getMySlots(userId);
  }

  async getMyEvents(userId: number) {
    return this.db
      .select()
      .from(schema.availabilityCalendarEvents)
      .where(eq(schema.availabilityCalendarEvents.userId, userId))
      .orderBy(
        schema.availabilityCalendarEvents.startDate,
        schema.availabilityCalendarEvents.startTime,
      );
  }

  async setEvents(userId: number, dto: SetCalendarEventsDto) {
    await this.db
      .delete(schema.availabilityCalendarEvents)
      .where(eq(schema.availabilityCalendarEvents.userId, userId));
    if (dto.events.length > 0) {
      await this.db.insert(schema.availabilityCalendarEvents).values(
        dto.events.map((event) => ({
          userId,
          ...event,
          isActive: true,
        })),
      );
    }
    await this.cacheInvalidation.invalidateIntersections();
    return this.getMyEvents(userId);
  }

  async getAllUsers(userId: number, groupId?: number) {
    const users = groupId
      ? await this.getGroupUsers(userId, groupId)
      : await this.db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            avatar: schema.users.avatar,
          })
          .from(schema.users);
    const allSlots = await this.db.select().from(schema.availabilitySlots);
    return users.map((u) => ({
      ...u,
      slots: allSlots.filter((s) => s.userId === u.id),
    }));
  }

  async getIntersection(
    query: GetIntersectionQueryDto,
    userId: number,
  ): Promise<IntersectionResponse | RangeIntersectionResponse> {
    const {
      userIds,
      date,
      startDate,
      endDate,
      durationMinutes,
      groupId,
      maxIntersectionRangeDays,
    } = query;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return {
        availableSlots: [],
        availableRanges: [],
        messageKey: 'availability.intersection.choose_participants',
      };
    }

    if (groupId) {
      await this.requireGroupMember(userId, groupId);
      await this.ensureUsersBelongToGroup(userIds, groupId);
    }

    const cacheKey = this.buildIntersectionCacheKey(query);
    const cacheVersion = await this.cacheInvalidation.getIntersectionVersion();
    const cached = this.getCachedIntersection(cacheKey, cacheVersion);
    if (cached) return cached;

    let result: IntersectionResponse | RangeIntersectionResponse;
    if (startDate || endDate) {
      result = await this.getRangeIntersection({
        userIds,
        startDate,
        endDate,
        durationMinutes,
        maxIntersectionRangeDays,
      });
      this.setCachedIntersection(cacheKey, result, cacheVersion);
      return result;
    }

    if (!date) {
      return {
        availableSlots: [],
        availableRanges: [],
        messageKey: 'availability.intersection.invalid_date',
      };
    }

    result = await this.getDateIntersection(userIds, date, durationMinutes);
    this.setCachedIntersection(cacheKey, result, cacheVersion);
    return result;
  }

  private async getRangeIntersection({
    userIds,
    startDate,
    endDate,
    durationMinutes,
    maxIntersectionRangeDays,
  }: {
    userIds: number[];
    startDate?: string;
    endDate?: string;
    durationMinutes?: number;
    maxIntersectionRangeDays?: number;
  }): Promise<RangeIntersectionResponse> {
    if (!startDate || !endDate) {
      return {
        days: [],
        messageKey: 'availability.intersection.invalid_date',
      };
    }

    const dates = this.buildDateRange(startDate, endDate);
    if (dates.length === 0) {
      return {
        days: [],
        messageKey: 'availability.intersection.invalid_date',
      };
    }

    const effectiveMaxIntersectionRangeDays =
      maxIntersectionRangeDays ?? DEFAULT_MAX_INTERSECTION_RANGE_DAYS;

    if (dates.length > effectiveMaxIntersectionRangeDays) {
      return {
        days: [],
        messageKey: 'availability.intersection.range_too_long',
      };
    }

    const candidates = await this.getIntersectionCandidatesForRange(
      userIds,
      dates,
      startDate,
      endDate,
    );

    const days = await Promise.all(
      dates.map(async (dateKey): Promise<DayIntersectionResponse> => {
        const result = await this.getDateIntersection(
          userIds,
          dateKey,
          durationMinutes,
          candidates,
        );
        return { date: dateKey, ...result };
      }),
    );

    return { days, messageKey: null };
  }

  private async getDateIntersection(
    userIds: number[],
    date: string,
    durationMinutes?: number,
    candidates?: IntersectionCandidates,
  ): Promise<IntersectionResponse> {
    const targetDate = new Date(date + 'T00:00:00');
    if (Number.isNaN(targetDate.getTime())) {
      return {
        availableSlots: [],
        availableRanges: [],
        messageKey: 'availability.intersection.invalid_date',
      };
    }

    const dayOfWeek = targetDate.getDay();

    const slots =
      candidates?.slots.filter((slot) => slot.dayOfWeek === dayOfWeek) ??
      (await this.getAvailabilitySlotsForDays(userIds, [dayOfWeek]));

    const calendarEvents =
      candidates?.calendarEvents ??
      (await this.getCalendarEventsForDateRange(userIds, date, date));

    const byUser = new Map<number, typeof slots>();
    for (const s of slots) {
      if (!byUser.has(s.userId)) byUser.set(s.userId, []);
      byUser.get(s.userId).push(s);
    }

    const eventByUser = new Map<number, typeof calendarEvents>();
    for (const event of calendarEvents) {
      if (!eventByUser.has(event.userId)) eventByUser.set(event.userId, []);
      eventByUser.get(event.userId).push(event);
    }

    const dateStart = new Date(date + 'T00:00:00');
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);
    const busyCandidates =
      candidates ??
      (await this.getBusyMeetingCandidatesForDateRange(
        userIds,
        dateStart,
        dateEnd,
      ));
    const existingMeetings = busyCandidates.meetings.filter(
      (meeting) => meeting.startTime < dateEnd && meeting.endTime > dateStart,
    );

    const mIds = existingMeetings
      .map((m) => m.id)
      .filter((id): id is number => id !== null);
    let busyRanges: { start: number; end: number }[] = [];
    if (mIds.length > 0) {
      const parts = busyCandidates.meetingParticipants.filter((participant) =>
        mIds.includes(participant.meetingId),
      );
      const partMeetingIds = new Set(parts.map((p) => p.meetingId));
      const relevant = existingMeetings.filter(
        (m) => partMeetingIds.has(m.id) || userIds.includes(m.organizerId),
      );
      busyRanges = relevant.map((m) => ({
        start: this.dateToMinutesInDay(m.startTime, dateStart, 'start'),
        end: this.dateToMinutesInDay(m.endTime, dateStart, 'end'),
      }));
    }

    const userRanges: RangeWithSources[][] = [];
    const unavailableUserIds: number[] = [];
    for (const userId of userIds) {
      const weeklyRanges = byUser.get(userId) ?? [];
      const calendarRanges = eventByUser.get(userId) ?? [];
      const ranges = [
        ...weeklyRanges.map((slot) => ({
          start: this.timeToMinutes(slot.startTime),
          end: this.timeToMinutes(slot.endTime),
          sources: [
            {
              userId: slot.userId,
              sourceType: 'weekly' as const,
              sourceId: slot.id,
            },
          ],
        })),
        ...calendarRanges
          .filter((event) => this.calendarEventApplies(event, date))
          .map((event) => ({
            start: this.timeToMinutes(event.startTime),
            end: this.timeToMinutes(event.endTime),
            sources: [
              {
                userId: event.userId,
                sourceType: 'calendar' as const,
                sourceId: event.id,
                startDate: event.startDate,
                endDate: event.endDate,
                repeatEveryDays: event.repeatEveryDays,
              },
            ],
          })),
      ];

      if (ranges.length === 0) {
        unavailableUserIds.push(userId);
        continue;
      }

      userRanges.push(this.mergeRanges(ranges));
    }

    if (unavailableUserIds.length > 0) {
      return {
        availableSlots: [],
        availableRanges: [],
        messageKey: 'availability.intersection.no_availability',
        unavailableUserIds,
      };
    }

    let common = userRanges[0];
    for (let i = 1; i < userRanges.length; i++) {
      common = this.intersectRanges(common, userRanges[i]);
      if (common.length === 0) break;
    }

    let free = common;
    for (const b of busyRanges) free = this.subtractRanges(free, b);
    const availableRanges = free.map((range) => ({
      start: this.minutesToTime(range.start),
      end: this.minutesToTime(range.end),
      durationMinutes: range.end - range.start,
      sources: range.sources,
    }));

    const result: AvailableSlot[] = [];
    if (typeof durationMinutes === 'number') {
      for (const r of free) {
        let cur = r.start;
        while (cur + durationMinutes <= r.end) {
          result.push({
            start: this.minutesToTime(cur),
            end: this.minutesToTime(cur + durationMinutes),
            sources: r.sources,
          });
          cur += durationMinutes;
        }
      }
    } else {
      for (const r of free) {
        result.push({
          start: this.minutesToTime(r.start),
          end: this.minutesToTime(r.end),
          sources: r.sources,
        });
      }
    }
    return { availableSlots: result, availableRanges, messageKey: null };
  }

  private buildDateRange(startDate: string, endDate: string): string[] {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return [];
    }

    const dates: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(this.formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  private getCalendarEventsForDateRange(
    userIds: number[],
    startDate: string,
    endDate: string,
  ): Promise<CalendarEvent[]> {
    return this.db
      .select()
      .from(schema.availabilityCalendarEvents)
      .where(
        and(
          inArray(schema.availabilityCalendarEvents.userId, userIds),
          eq(schema.availabilityCalendarEvents.isActive, true),
          lte(schema.availabilityCalendarEvents.startDate, endDate),
          gte(schema.availabilityCalendarEvents.endDate, startDate),
        ),
      );
  }

  private buildIntersectionCacheKey(query: GetIntersectionQueryDto): string {
    return JSON.stringify({
      date: query.date ?? null,
      durationMinutes: query.durationMinutes ?? null,
      endDate: query.endDate ?? null,
      groupId: query.groupId ?? null,
      startDate: query.startDate ?? null,
      userIds: [...query.userIds].sort((a, b) => a - b),
    });
  }

  private getCachedIntersection(
    key: string,
    cacheVersion: number,
  ): IntersectionResponse | RangeIntersectionResponse | null {
    const cached = this.intersectionCache.get(key);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now() || cached.version !== cacheVersion) {
      this.intersectionCache.delete(key);
      return null;
    }

    return this.cloneIntersectionResponse(cached.value);
  }

  private setCachedIntersection(
    key: string,
    value: IntersectionResponse | RangeIntersectionResponse,
    cacheVersion: number,
  ) {
    this.intersectionCache.set(key, {
      expiresAt: Date.now() + INTERSECTION_CACHE_TTL_MS,
      value: this.cloneIntersectionResponse(value),
      version: cacheVersion,
    });
  }

  private clearIntersectionCache() {
    this.intersectionCache.clear();
  }

  private cloneIntersectionResponse<
    T extends IntersectionResponse | RangeIntersectionResponse,
  >(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private async getIntersectionCandidatesForRange(
    userIds: number[],
    dates: string[],
    startDate: string,
    endDate: string,
  ): Promise<IntersectionCandidates> {
    const dayOfWeeks = [
      ...new Set(
        dates.map((dateKey) => new Date(`${dateKey}T00:00:00`).getDay()),
      ),
    ];
    const rangeStart = new Date(`${startDate}T00:00:00`);
    const rangeEnd = new Date(`${endDate}T00:00:00`);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    const [slots, calendarEvents, busyCandidates] = await Promise.all([
      this.getAvailabilitySlotsForDays(userIds, dayOfWeeks),
      this.getCalendarEventsForDateRange(userIds, startDate, endDate),
      this.getBusyMeetingCandidatesForDateRange(userIds, rangeStart, rangeEnd),
    ]);

    return {
      calendarEvents,
      meetingParticipants: busyCandidates.meetingParticipants,
      meetings: busyCandidates.meetings,
      slots,
    };
  }

  private getAvailabilitySlotsForDays(
    userIds: number[],
    dayOfWeeks: number[],
  ): Promise<schema.AvailabilitySlot[]> {
    return this.db
      .select()
      .from(schema.availabilitySlots)
      .where(
        and(
          inArray(schema.availabilitySlots.userId, userIds),
          inArray(schema.availabilitySlots.dayOfWeek, dayOfWeeks),
          eq(schema.availabilitySlots.isActive, true),
        ),
      );
  }

  private async getBusyMeetingCandidatesForDateRange(
    userIds: number[],
    start: Date,
    end: Date,
  ): Promise<BusyMeetingCandidates> {
    const organizerMeetings = await this.db
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
          inArray(schema.meetings.organizerId, userIds),
          lt(schema.meetings.startTime, end),
          gt(schema.meetings.endTime, start),
        ),
      );

    const participantRows = await this.db
      .select({
        meeting: {
          id: schema.meetings.id,
          startTime: schema.meetings.startTime,
          endTime: schema.meetings.endTime,
          organizerId: schema.meetings.organizerId,
        },
        participant: schema.meetingParticipants,
      })
      .from(schema.meetingParticipants)
      .innerJoin(
        schema.meetings,
        eq(schema.meetings.id, schema.meetingParticipants.meetingId),
      )
      .where(
        and(
          inArray(schema.meetingParticipants.userId, userIds),
          inArray(schema.meetingParticipants.status, ['pending', 'confirmed']),
          eq(schema.meetings.status, 'scheduled'),
          lt(schema.meetings.startTime, end),
          gt(schema.meetings.endTime, start),
        ),
      );

    const meetingById = new Map<number, MeetingCandidate>();
    for (const meeting of organizerMeetings) {
      meetingById.set(meeting.id, meeting);
    }
    for (const { meeting } of participantRows) {
      meetingById.set(meeting.id, meeting);
    }

    return {
      meetingParticipants: participantRows.map(
        ({ participant }) => participant,
      ),
      meetings: [...meetingById.values()],
    };
  }

  private formatDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private calendarEventApplies(
    event: CalendarEvent,
    targetDateKey: string,
  ): boolean {
    if (targetDateKey < event.startDate || targetDateKey > event.endDate) {
      return false;
    }

    const startDate = new Date(`${event.startDate}T00:00:00`);
    const diffDays = Math.floor(
      (new Date(`${targetDateKey}T00:00:00`).getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return diffDays >= 0 && diffDays % event.repeatEveryDays === 0;
  }

  private timeToMinutes(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private dateToMinutesInDay(
    value: Date,
    dayStart: Date,
    edge: 'start' | 'end',
  ) {
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);

    if (value <= dayStart) return 0;
    if (value >= nextDay) return 24 * 60;

    const minutes = value.getHours() * 60 + value.getMinutes();
    return edge === 'end' && minutes === 0 ? 24 * 60 : minutes;
  }

  private async getGroupUsers(userId: number, groupId: number) {
    await this.requireGroupMember(userId, groupId);

    return this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
      })
      .from(schema.groupMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.groupMembers.userId))
      .where(eq(schema.groupMembers.groupId, groupId))
      .orderBy(schema.users.name, schema.users.email);
  }

  private async requireGroupMember(userId: number, groupId: number) {
    const [membership] = await this.db
      .select()
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.userId, userId),
          eq(schema.groupMembers.groupId, groupId),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException('Доступна только участникам группы');
    }
  }

  private async ensureUsersBelongToGroup(userIds: number[], groupId: number) {
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
      throw new ForbiddenException(
        'Искать время можно только для участников выбранной группы',
      );
    }
  }

  private minutesToTime(mins: number) {
    const h = Math.floor(mins / 60),
      m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  private mergeRanges(ranges: RangeWithSources[]): RangeWithSources[] {
    const sorted = [...ranges].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });
    const merged: RangeWithSources[] = [];

    for (const range of sorted) {
      const previous = merged[merged.length - 1];
      if (!previous || range.start > previous.end) {
        merged.push({
          start: range.start,
          end: range.end,
          sources: [...range.sources],
        });
        continue;
      }

      previous.end = Math.max(previous.end, range.end);
      previous.sources = [...previous.sources, ...range.sources];
    }

    return merged;
  }

  private intersectRanges(
    left: RangeWithSources[],
    right: RangeWithSources[],
  ): RangeWithSources[] {
    const result: RangeWithSources[] = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
      const leftRange = left[leftIndex];
      const rightRange = right[rightIndex];
      const start = Math.max(leftRange.start, rightRange.start);
      const end = Math.min(leftRange.end, rightRange.end);

      if (start < end) {
        result.push({
          start,
          end,
          sources: [...leftRange.sources, ...rightRange.sources],
        });
      }

      if (leftRange.end < rightRange.end) {
        leftIndex += 1;
      } else {
        rightIndex += 1;
      }
    }

    return result;
  }

  private subtractRanges(
    ranges: RangeWithSources[],
    busy: { start: number; end: number },
  ) {
    const result: RangeWithSources[] = [];
    for (const range of ranges) {
      if (busy.end <= range.start || busy.start >= range.end) {
        result.push(range);
        continue;
      }

      if (busy.start > range.start) {
        result.push({
          start: range.start,
          end: busy.start,
          sources: range.sources,
        });
      }
      if (busy.end < range.end) {
        result.push({
          start: busy.end,
          end: range.end,
          sources: range.sources,
        });
      }
    }
    return result;
  }
}
