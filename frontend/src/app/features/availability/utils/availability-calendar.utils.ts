import {
  CreateAvailabilityCalendarEventPayload,
  Meeting,
} from "../../../core/models/api.model";
import {
  CALENDAR_GRID_DAYS_IN_WEEK,
  MONTH_CELL_VISIBLE_ITEMS_LIMIT,
  MonthCell,
  MonthCellItem,
  SINGLE_EVENT_REPEAT_EVERY_DAYS,
} from "../models/availability-calendar.model";

export interface BuildMonthCellsOptions {
  month: Date;
  today: Date;
  slotsForDay: (dayIndex: number) => {
    startTime: string;
    endTime: string;
  }[];
  visibleCalendarEventsForDate: (
    dateKey: string,
  ) => { event: CreateAvailabilityCalendarEventPayload; index: number }[];
  meetingsForDate: (dateKey: string) => Meeting[];
  isPastMeeting: (meeting: Meeting) => boolean;
  formatTime: (value: string) => string;
  repeatLabel: (value: number) => string;
  translate: (key: string) => string;
  timeToMinutes: (value: string) => number;
}

export function buildMonthCells({
  month,
  today,
  slotsForDay,
  visibleCalendarEventsForDate,
  meetingsForDate,
  isPastMeeting,
  formatTime,
  repeatLabel,
  translate,
  timeToMinutes,
}: BuildMonthCellsOptions): MonthCell[] {
  const start = getMonthGridStart(month);
  const end = getMonthGridEnd(month);
  const todayKey = formatDateKey(today);
  const cells: MonthCell[] = [];
  const date = new Date(start);

  while (date <= end) {
    const dateKey = formatDateKey(date);
    const items = monthItemsForDate({
      date,
      slotsForDay,
      visibleCalendarEventsForDate,
      meetingsForDate,
      isPastMeeting,
      formatTime,
      repeatLabel,
      translate,
      timeToMinutes,
    });

    cells.push({
      date: new Date(date),
      dateKey,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
      isToday: dateKey === todayKey,
      hasMeeting: items.some((item) => item.kind === "meeting"),
      items,
      visibleItems: items.slice(0, MONTH_CELL_VISIBLE_ITEMS_LIMIT),
      hiddenItemsCount: Math.max(
        items.length - MONTH_CELL_VISIBLE_ITEMS_LIMIT,
        0,
      ),
    });
    date.setDate(date.getDate() + 1);
  }

  return cells;
}

export function calendarEventApplies(
  event: CreateAvailabilityCalendarEventPayload,
  targetDateKey: string,
) {
  if (targetDateKey < event.startDate || targetDateKey > event.endDate) {
    return false;
  }

  const startDate = new Date(`${event.startDate}T00:00:00`);
  const targetDate = new Date(`${targetDateKey}T00:00:00`);
  const diffDays = Math.floor(
    (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return diffDays >= 0 && diffDays % event.repeatEveryDays === 0;
}

export function sortCalendarEvents(
  events: CreateAvailabilityCalendarEventPayload[],
  timeToMinutes: (value: string) => number,
) {
  return [...events].sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) ||
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
      timeToMinutes(a.endTime) - timeToMinutes(b.endTime),
  );
}

export function isSingleEvent(event: CreateAvailabilityCalendarEventPayload) {
  return (
    event.startDate === event.endDate &&
    event.repeatEveryDays === SINGLE_EVENT_REPEAT_EVERY_DAYS
  );
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export function weekOffset(date: Date) {
  return (date.getDay() + (CALENDAR_GRID_DAYS_IN_WEEK - 1)) %
    CALENDAR_GRID_DAYS_IN_WEEK;
}

function monthItemsForDate({
  date,
  slotsForDay,
  visibleCalendarEventsForDate,
  meetingsForDate,
  isPastMeeting,
  formatTime,
  repeatLabel,
  translate,
  timeToMinutes,
}: Omit<BuildMonthCellsOptions, "month" | "today"> & { date: Date }): MonthCellItem[] {
  const dateKey = formatDateKey(date);
  const weeklyItems = slotsForDay(date.getDay()).map((slot, slotIndex) => ({
    tooltip: translate("availability.weekly_slot_tooltip"),
    kind: "weekly" as const,
    timeRange: `${slot.startTime}—${slot.endTime}`,
    dayIndex: date.getDay(),
    slotIndex,
  }));

  const appliedEvents = visibleCalendarEventsForDate(dateKey);
  const dateItems = appliedEvents.map(({ event, index }) => ({
    tooltip:
      event.repeatEveryDays === SINGLE_EVENT_REPEAT_EVERY_DAYS
        ? translate("availability.date_slot_tooltip")
        : `${translate("availability.every")} ${event.repeatEveryDays} ${repeatLabel(
            event.repeatEveryDays,
          )}`,
    kind: "date" as const,
    timeRange: `${event.startTime}—${event.endTime}`,
    eventIndex: index,
  }));

  const meetingItems = meetingsForDate(dateKey).map((meeting) => ({
    tooltip: `${translate("availability.meeting_tooltip_prefix")}: ${meeting.title}`,
    kind: "meeting" as const,
    isPast: isPastMeeting(meeting),
    title: meeting.title,
    timeRange: `${formatTime(meeting.startTime)}—${formatTime(
      meeting.endTime,
    )}`,
    meeting,
  }));

  return [...meetingItems, ...weeklyItems, ...dateItems].sort(
    (first, second) =>
      timeToMinutes(first.timeRange.slice(0, 5)) -
        timeToMinutes(second.timeRange.slice(0, 5)) ||
      itemKindOrder(first.kind) - itemKindOrder(second.kind),
  );
}

function getMonthGridStart(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayFirstOffset = toMondayFirstWeekday(firstDay.getDay());
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayFirstOffset);
  return gridStart;
}

function getMonthGridEnd(month: Date) {
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const mondayFirstOffset = toMondayFirstWeekday(lastDay.getDay());
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(
    lastDay.getDate() + (CALENDAR_GRID_DAYS_IN_WEEK - 1 - mondayFirstOffset),
  );
  return gridEnd;
}

function toMondayFirstWeekday(nativeDayIndex: number) {
  return (nativeDayIndex + (CALENDAR_GRID_DAYS_IN_WEEK - 1)) %
    CALENDAR_GRID_DAYS_IN_WEEK;
}

function itemKindOrder(kind: MonthCellItem["kind"]) {
  const order: Record<MonthCellItem["kind"], number> = {
    date: 0,
    weekly: 1,
    meeting: 2,
  };
  return order[kind];
}
