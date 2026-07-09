import {
  CreateAvailabilityCalendarEventPayload,
  CreateSlotPayload,
  Meeting,
} from "../../../core/models/api.model";

export interface WeekdayOption {
  index: number;
  shortLabelKey: string;
  longLabelKey: string;
}

export type MonthCellItemKind = "weekly" | "date" | "meeting";

export interface MonthCellItem {
  tooltip: string;
  kind: MonthCellItemKind;
  timeRange: string;
  isPast?: boolean;
  title?: string;
  eventIndex?: number;
  dayIndex?: number;
  slotIndex?: number;
  meeting?: Meeting;
}

export interface MonthCell {
  date: Date;
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  hasMeeting: boolean;
  items: MonthCellItem[];
  visibleItems: MonthCellItem[];
  hiddenItemsCount: number;
}

export interface OverlappingCalendarEvent {
  event: CreateAvailabilityCalendarEventPayload;
  index: number;
}

export type AvailabilityConflictKind = "single" | "recurring" | "mixed";
export type MixedConflictChoice = "date" | "recurring" | "cancel";

export const WEEKDAYS: WeekdayOption[] = [
  { index: 1, shortLabelKey: "weekday.mon.short", longLabelKey: "weekday.mon" },
  { index: 2, shortLabelKey: "weekday.tue.short", longLabelKey: "weekday.tue" },
  { index: 3, shortLabelKey: "weekday.wed.short", longLabelKey: "weekday.wed" },
  { index: 4, shortLabelKey: "weekday.thu.short", longLabelKey: "weekday.thu" },
  { index: 5, shortLabelKey: "weekday.fri.short", longLabelKey: "weekday.fri" },
  { index: 6, shortLabelKey: "weekday.sat.short", longLabelKey: "weekday.sat" },
  { index: 0, shortLabelKey: "weekday.sun.short", longLabelKey: "weekday.sun" },
];

export const CALENDAR_GRID_DAYS_IN_WEEK = 7;
export const CALENDAR_FOCUS_DELAY_MS = 0;
export const DEFAULT_RECURRING_EVENT_YEARS = 1;
export const MONTH_CELL_VISIBLE_ITEMS_LIMIT = 3;
export const SINGLE_EVENT_REPEAT_EVERY_DAYS = 1;
export const WEEKLY_REPEAT_EVERY_DAYS = 7;

export type AvailabilitySlotDraft = CreateSlotPayload;
