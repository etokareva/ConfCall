import {
  IsInt,
  IsString,
  Min,
  Max,
  Matches,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateQuery(value: unknown) {
  if (Array.isArray(value)) {
    return normalizeDateQuery(value[0]);
  }
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

function normalizeNumberQuery(value: unknown) {
  if (Array.isArray(value)) {
    return normalizeNumberQuery(value[0]);
  }
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export class TimeSlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;
}

export class SetAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  slots: TimeSlotDto[];
}

export class CalendarEventDto {
  @Matches(ISO_DATE_ONLY_PATTERN)
  startDate: string;

  @Matches(ISO_DATE_ONLY_PATTERN)
  endDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  repeatEveryDays: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;
}

export class SetCalendarEventsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalendarEventDto)
  events: CalendarEventDto[];
}

export class GetIntersectionQueryDto {
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value !== 'string') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return value
        .split(',')
        .map(Number)
        .filter((id) => Number.isInteger(id));
    }
  })
  @IsArray()
  @IsInt({ each: true })
  userIds: number[];

  @IsOptional()
  @Transform(({ value }) => normalizeDateQuery(value))
  @Matches(ISO_DATE_ONLY_PATTERN)
  date?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeDateQuery(value))
  @Matches(ISO_DATE_ONLY_PATTERN)
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeDateQuery(value))
  @Matches(ISO_DATE_ONLY_PATTERN)
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeNumberQuery(value))
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @Transform(({ value }) => normalizeNumberQuery(value))
  @IsInt()
  @Min(1)
  groupId?: number;

  @IsOptional()
  @Transform(({ value }) => normalizeNumberQuery(value))
  @IsInt()
  @Min(1)
  maxIntersectionRangeDays?: number;
}

export function parseIntersectionQuery(
  query: Record<string, unknown>,
): GetIntersectionQueryDto {
  const parsed = new GetIntersectionQueryDto();

  const rawUserIds = query.userIds;
  if (Array.isArray(rawUserIds)) {
    parsed.userIds = rawUserIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));
  } else if (typeof rawUserIds === 'string') {
    try {
      const jsonValue = JSON.parse(rawUserIds);
      parsed.userIds = Array.isArray(jsonValue)
        ? jsonValue
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value))
        : [];
    } catch {
      parsed.userIds = rawUserIds
        .split(',')
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value));
    }
  } else {
    parsed.userIds = [];
  }

  const date = normalizeDateQuery(query.date);
  const startDate = normalizeDateQuery(query.startDate);
  const endDate = normalizeDateQuery(query.endDate);
  const durationMinutes = normalizeNumberQuery(query.durationMinutes);
  const groupId = normalizeNumberQuery(query.groupId);
  const maxIntersectionRangeDays = normalizeNumberQuery(
    query.maxIntersectionRangeDays,
  );

  if (typeof date === 'string' && ISO_DATE_ONLY_PATTERN.test(date)) {
    parsed.date = date;
  }

  if (
    typeof startDate === 'string' &&
    ISO_DATE_ONLY_PATTERN.test(startDate)
  ) {
    parsed.startDate = startDate;
  }

  if (typeof endDate === 'string' && ISO_DATE_ONLY_PATTERN.test(endDate)) {
    parsed.endDate = endDate;
  }

  if (typeof durationMinutes === 'number' && durationMinutes >= 1) {
    parsed.durationMinutes = durationMinutes;
  }

  if (typeof groupId === 'number' && groupId >= 1) {
    parsed.groupId = groupId;
  }

  if (
    typeof maxIntersectionRangeDays === 'number' &&
    maxIntersectionRangeDays >= 1
  ) {
    parsed.maxIntersectionRangeDays = maxIntersectionRangeDays;
  }

  return parsed;
}

export interface AvailableSlot {
  start: string;
  end: string;
  sources?: AvailabilityRangeSource[];
}

export interface AvailableRange extends AvailableSlot {
  durationMinutes: number;
}

export interface AvailabilityRangeSource {
  userId: number;
  sourceType: 'weekly' | 'calendar';
  sourceId?: number;
  startDate?: string;
  endDate?: string;
  repeatEveryDays?: number;
}

export interface IntersectionResponse {
  availableSlots: AvailableSlot[];
  availableRanges: AvailableRange[];
  messageKey: string | null;
  unavailableUserIds?: number[];
}

export interface DayIntersectionResponse extends IntersectionResponse {
  date: string;
}

export interface RangeIntersectionResponse {
  days: DayIntersectionResponse[];
  messageKey: string | null;
}

export interface CalendarEvent {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  repeatEveryDays: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}
