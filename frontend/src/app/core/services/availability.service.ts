import { Injectable } from "@angular/core";
import {
  Observable,
  ReplaySubject,
  EMPTY,
  catchError,
  tap,
  shareReplay,
} from "rxjs";
import { ApiClientService } from "./api-client.service";
import {
  AvailabilitySlot,
  AvailabilityCalendarEvent,
  CreateSlotPayload,
  CreateAvailabilityCalendarEventPayload,
  UserWithAvailability,
  AvailableSlot,
  AvailableRange,
  AvailabilityIntersectionResult,
  AvailabilityRangeIntersectionResult,
} from "../models/api.model";

@Injectable({ providedIn: "root" })
export class AvailabilityService {
  private slotsSubject = new ReplaySubject<AvailabilitySlot[]>(1);
  private eventsSubject = new ReplaySubject<AvailabilityCalendarEvent[]>(1);

  slots$ = this.slotsSubject.asObservable().pipe(shareReplay(1));
  events$ = this.eventsSubject.asObservable().pipe(shareReplay(1));

  users$ = this.client
    .get<UserWithAvailability[]>("/availability/users")
    .pipe(shareReplay(1));

  constructor(private client: ApiClientService) {
    this.loadSlots();
    this.loadEvents();
  }

  loadSlots(): void {
    this.client
      .get<AvailabilitySlot[]>("/availability/slots")
      .pipe(tap((slots) => this.slotsSubject.next(slots)))
      .subscribe();
  }

  setSlots(slots: CreateSlotPayload[]): Observable<AvailabilitySlot[]> {
    return this.client
      .post<AvailabilitySlot[]>("/availability/slots", { slots })
      .pipe(tap((savedSlots) => this.slotsSubject.next(savedSlots)));
  }

  loadEvents(): void {
    this.client
      .get<AvailabilityCalendarEvent[]>("/availability/events")
      .pipe(
        tap((events) => this.eventsSubject.next(events)),
        catchError(() => {
          this.eventsSubject.next([]);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  setEvents(
    events: CreateAvailabilityCalendarEventPayload[],
  ): Observable<AvailabilityCalendarEvent[]> {
    return this.client
      .post<AvailabilityCalendarEvent[]>("/availability/events", { events })
      .pipe(tap((savedEvents) => this.eventsSubject.next(savedEvents)));
  }

  getIntersection(
    userIds: number[],
    date: string,
    durationMinutes?: number,
    groupId?: number,
  ): Observable<AvailabilityIntersectionResult> {
    const params = new URLSearchParams({
      userIds: JSON.stringify(userIds),
      date: this.toIsoDateParam(date),
    });
    if (durationMinutes != null) {
      params.set("durationMinutes", String(durationMinutes));
    }
    if (groupId) {
      params.set("groupId", String(groupId));
    }
    return this.client.get<AvailabilityIntersectionResult>(
      `/availability/intersection?${params}`,
    );
  }

  getIntersectionRange(
    userIds: number[],
    startDate: string,
    endDate: string,
    durationMinutes?: number,
    groupId?: number,
  ): Observable<AvailabilityRangeIntersectionResult> {
    const params = new URLSearchParams({
      userIds: JSON.stringify(userIds),
      startDate: this.toIsoDateParam(startDate),
      endDate: this.toIsoDateParam(endDate),
    });
    if (durationMinutes != null) {
      params.set("durationMinutes", String(durationMinutes));
    }
    if (groupId) {
      params.set("groupId", String(groupId));
    }
    return this.client.get<AvailabilityRangeIntersectionResult>(
      `/availability/intersection?${params}`,
    );
  }

  private toIsoDateParam(value: string) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const displayMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
    if (displayMatch) {
      const [, day, month, year] = displayMatch;
      return `${year}-${month}-${day}`;
    }

    return trimmed;
  }
}
