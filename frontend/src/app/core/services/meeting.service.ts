import { Injectable } from "@angular/core";
import {
  Observable,
  BehaviorSubject,
  tap,
  shareReplay,
  map,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
} from "rxjs";
import { ApiClientService } from "./api-client.service";
import { Meeting } from "../models/api.model";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class MeetingService {
  private meetingsSubject = new BehaviorSubject<Meeting[]>([]);

  meetings$ = this.meetingsSubject.asObservable().pipe(shareReplay(1));
  newMeetingsCount$ = this.meetings$.pipe(
    map(
      (meetings) =>
        meetings.filter(
          (meeting) => meeting.isNew && meeting.status === "scheduled",
        ).length,
    ),
  );

  constructor(
    private client: ApiClientService,
    private auth: AuthService,
  ) {
    this.auth.user$
      .pipe(
        map((user) => user?.id ?? null),
        distinctUntilChanged(),
        switchMap((userId) => {
          if (!userId) {
            this.meetingsSubject.next([]);
            return of([]);
          }

          return this.refreshMeetings().pipe(
            catchError(() => {
              this.meetingsSubject.next([]);
              return of([]);
            }),
          );
        }),
      )
      .subscribe();
  }

  currentMeetings() {
    return this.meetingsSubject.value;
  }

  loadMeetings(): void {
    this.refreshMeetings().subscribe();
  }

  refreshMeetings(): Observable<Meeting[]> {
    if (!this.auth.isAuthenticated()) {
      this.meetingsSubject.next([]);
      return of([]);
    }

    return this.client
      .get<Meeting[]>("/meetings/my")
      .pipe(tap((meetings) => this.meetingsSubject.next(meetings)));
  }

  create(data: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    participantEmails: string[];
    groupId?: number;
  }): Observable<Meeting> {
    return this.client.post<Meeting>("/meetings", data).pipe(
      tap((meeting) => {
        this.meetingsSubject.next([...this.meetingsSubject.value, meeting]);
      }),
    );
  }

  cancel(id: number): Observable<Meeting> {
    return this.client.post<Meeting>(`/meetings/${id}/cancel`, {}).pipe(
      tap((updated) => {
        this.meetingsSubject.next(
          this.meetingsSubject.value.map((meeting) =>
            meeting.id === updated.id ? updated : meeting,
          ),
        );
      }),
    );
  }

  decline(id: number): Observable<Meeting> {
    return this.client.post<Meeting>(`/meetings/${id}/decline`, {}).pipe(
      tap((updated) => {
        this.meetingsSubject.next(
          this.meetingsSubject.value.map((meeting) =>
            meeting.id === updated.id ? updated : meeting,
          ),
        );
      }),
    );
  }

  markSeen(): Observable<{ ok: true }> {
    return this.client.post<{ ok: true }>("/meetings/mark-seen", {}).pipe(
      tap(() => {
        this.meetingsSubject.next(
          this.meetingsSubject.value.map((meeting) => ({
            ...meeting,
            isNew: false,
          })),
        );
      }),
    );
  }
}
