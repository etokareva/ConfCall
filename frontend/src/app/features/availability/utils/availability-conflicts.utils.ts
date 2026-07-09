import { CreateAvailabilityCalendarEventPayload } from "../../../core/models/api.model";
import {
  AvailabilityConflictKind,
  OverlappingCalendarEvent,
  SINGLE_EVENT_REPEAT_EVERY_DAYS,
} from "../models/availability-calendar.model";
import {
  calendarEventApplies,
  formatDateKey,
  isSingleEvent,
} from "./availability-calendar.utils";

export function findOverlappingEvents(
  calendarEvents: CreateAvailabilityCalendarEventPayload[],
  event: CreateAvailabilityCalendarEventPayload,
  timeToMinutes: (value: string) => number,
) {
  return calendarEvents
    .map((existing, index) => ({ event: existing, index }))
    .filter(({ event: existing }) => eventsOverlap(existing, event, timeToMinutes));
}

export function conflictKind(
  event: CreateAvailabilityCalendarEventPayload,
  overlappingEvents: OverlappingCalendarEvent[],
): AvailabilityConflictKind {
  const relatedEvents = [event, ...overlappingEvents.map(({ event: item }) => item)];
  const hasSingle = relatedEvents.some((item) => isSingleEvent(item));
  const hasRecurring = relatedEvents.some((item) => !isSingleEvent(item));

  if (hasSingle && hasRecurring) return "mixed";
  return hasSingle ? "single" : "recurring";
}

export function mergeCalendarEvents(
  calendarEvents: CreateAvailabilityCalendarEventPayload[],
  event: CreateAvailabilityCalendarEventPayload,
  overlappingEvents: OverlappingCalendarEvent[],
  timeToMinutes: (value: string) => number,
  minutesToTime: (value: number) => string,
  sortEvents: (
    items: CreateAvailabilityCalendarEventPayload[],
  ) => CreateAvailabilityCalendarEventPayload[],
) {
  const eventsToMerge = [event, ...overlappingEvents.map(({ event: item }) => item)];
  const baseEvent = overlappingEvents[0].event;
  const mergedEvent: CreateAvailabilityCalendarEventPayload = {
    startDate: eventsToMerge.reduce(
      (earliest, item) => (item.startDate < earliest ? item.startDate : earliest),
      event.startDate,
    ),
    endDate: eventsToMerge.reduce(
      (latest, item) => (item.endDate > latest ? item.endDate : latest),
      event.endDate,
    ),
    repeatEveryDays: baseEvent.repeatEveryDays,
    startTime: minutesToTime(
      Math.min(...eventsToMerge.map((item) => timeToMinutes(item.startTime))),
    ),
    endTime: minutesToTime(
      Math.max(...eventsToMerge.map((item) => timeToMinutes(item.endTime))),
    ),
  };
  const indexesToRemove = new Set(overlappingEvents.map(({ index }) => index));

  return sortEvents([
    ...calendarEvents.filter((_, index) => !indexesToRemove.has(index)),
    mergedEvent,
  ]);
}

export function mergeAsDateOverride(
  calendarEvents: CreateAvailabilityCalendarEventPayload[],
  event: CreateAvailabilityCalendarEventPayload,
  overlappingEvents: OverlappingCalendarEvent[],
  timeToMinutes: (value: string) => number,
  minutesToTime: (value: number) => string,
  sortEvents: (
    items: CreateAvailabilityCalendarEventPayload[],
  ) => CreateAvailabilityCalendarEventPayload[],
) {
  const overrideDate = resolveDateOverrideKey(event, overlappingEvents);
  const eventsToMerge = [
    event,
    ...overlappingEvents
      .map(({ event: item }) => item)
      .filter((item) => calendarEventApplies(item, overrideDate)),
  ];
  const mergedEvent: CreateAvailabilityCalendarEventPayload = {
    startDate: overrideDate,
    endDate: overrideDate,
    repeatEveryDays: SINGLE_EVENT_REPEAT_EVERY_DAYS,
    startTime: minutesToTime(
      Math.min(...eventsToMerge.map((item) => timeToMinutes(item.startTime))),
    ),
    endTime: minutesToTime(
      Math.max(...eventsToMerge.map((item) => timeToMinutes(item.endTime))),
    ),
  };
  const indexesToRemove = new Set(
    overlappingEvents
      .filter(({ event: item }) => isSingleEvent(item))
      .map(({ index }) => index),
  );

  return sortEvents([
    ...calendarEvents.filter((_, index) => !indexesToRemove.has(index)),
    mergedEvent,
  ]);
}

export function mergeRecurringRule(
  calendarEvents: CreateAvailabilityCalendarEventPayload[],
  event: CreateAvailabilityCalendarEventPayload,
  overlappingEvents: OverlappingCalendarEvent[],
  timeToMinutes: (value: string) => number,
  minutesToTime: (value: number) => string,
  sortEvents: (
    items: CreateAvailabilityCalendarEventPayload[],
  ) => CreateAvailabilityCalendarEventPayload[],
) {
  const recurringOverlaps = overlappingEvents.filter(
    ({ event: item }) => !isSingleEvent(item),
  );
  const baseEvent = !isSingleEvent(event) ? event : recurringOverlaps[0].event;
  const eventsToMerge = [event, ...overlappingEvents.map(({ event: item }) => item)];
  const indexesToRemove = new Set(overlappingEvents.map(({ index }) => index));
  const mergedEvent: CreateAvailabilityCalendarEventPayload = {
    startDate: baseEvent.startDate,
    endDate: baseEvent.endDate,
    repeatEveryDays: baseEvent.repeatEveryDays,
    startTime: minutesToTime(
      Math.min(...eventsToMerge.map((item) => timeToMinutes(item.startTime))),
    ),
    endTime: minutesToTime(
      Math.max(...eventsToMerge.map((item) => timeToMinutes(item.endTime))),
    ),
  };

  return sortEvents([
    ...calendarEvents.filter((_, index) => !indexesToRemove.has(index)),
    mergedEvent,
  ]);
}

export function visibleCalendarEventsForDate(
  calendarEvents: CreateAvailabilityCalendarEventPayload[],
  dateKey: string,
  timeToMinutes: (value: string) => number,
) {
  const appliedEvents = calendarEvents
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => calendarEventApplies(event, dateKey));
  const singleEvents = appliedEvents.filter(({ event }) => isSingleEvent(event));

  return appliedEvents
    .filter(
      ({ event }) =>
        isSingleEvent(event) ||
        !singleEvents.some(({ event: singleEvent }) =>
          timeRangesOverlap(singleEvent, event, timeToMinutes),
        ),
    )
    .map(({ event, index }) => ({ event, index }));
}

function resolveDateOverrideKey(
  event: CreateAvailabilityCalendarEventPayload,
  overlappingEvents: OverlappingCalendarEvent[],
) {
  if (isSingleEvent(event)) return event.startDate;

  const singleOverlap = overlappingEvents.find(({ event: item }) =>
    isSingleEvent(item),
  );
  if (singleOverlap) return singleOverlap.event.startDate;

  return event.startDate;
}

function eventsOverlap(
  first: CreateAvailabilityCalendarEventPayload,
  second: CreateAvailabilityCalendarEventPayload,
  timeToMinutes: (value: string) => number,
) {
  if (!timeRangesOverlap(first, second, timeToMinutes)) return false;

  const startKey =
    first.startDate > second.startDate ? first.startDate : second.startDate;
  const endKey =
    first.endDate < second.endDate ? first.endDate : second.endDate;
  if (startKey > endKey) return false;

  const date = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);

  while (date <= end) {
    const dateKey = formatDateKey(date);
    if (
      calendarEventApplies(first, dateKey) &&
      calendarEventApplies(second, dateKey)
    ) {
      return true;
    }
    date.setDate(date.getDate() + 1);
  }

  return false;
}

function timeRangesOverlap(
  first: CreateAvailabilityCalendarEventPayload,
  second: CreateAvailabilityCalendarEventPayload,
  timeToMinutes: (value: string) => number,
) {
  return (
    timeToMinutes(first.startTime) < timeToMinutes(second.endTime) &&
    timeToMinutes(second.startTime) < timeToMinutes(first.endTime)
  );
}
