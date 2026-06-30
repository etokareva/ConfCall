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
