import { Injectable } from "@angular/core";
import {
  Observable,
  BehaviorSubject,
  EMPTY,
  catchError,
  finalize,
  tap,
  shareReplay,
} from "rxjs";
import { ApiClientService } from "./api-client.service";
import {
  AvailabilityIntersectionResult,
  AvailabilitySlot,
  BookingLink,
  BookingLinkContext,
} from "../models/api.model";

@Injectable({ providedIn: "root" })
export class BookingService {
  private linksSubject = new BehaviorSubject<BookingLink[]>([]);
  private linksLoadingSubject = new BehaviorSubject(true);
  private linksErrorSubject = new BehaviorSubject<string | null>(null);

  links$ = this.linksSubject.asObservable().pipe(shareReplay(1));
  linksLoading$ = this.linksLoadingSubject.asObservable().pipe(shareReplay(1));
  linksError$ = this.linksErrorSubject.asObservable().pipe(shareReplay(1));

  constructor(private client: ApiClientService) {
    this.loadLinks();
  }

  loadLinks(): void {
    this.linksLoadingSubject.next(true);
    this.linksErrorSubject.next(null);
    this.client
      .get<BookingLink[]>("/booking/links")
      .pipe(
        tap((links) => this.linksSubject.next(links)),
        catchError(() => {
          this.linksErrorSubject.next("settings.links_load_error");
          return EMPTY;
        }),
        finalize(() => this.linksLoadingSubject.next(false)),
      )
      .subscribe();
  }

  createLink(data: {
    groupId: number;
    participantIds: number[];
    title?: string;
    description?: string;
    durationMinutes?: number;
  }): Observable<BookingLink> {
    return this.client.post<BookingLink>("/booking/links", data).pipe(
      tap((link) => {
        this.linksSubject.next([...this.linksSubject.value, link]);
      }),
    );
  }

  deleteLink(id: number): Observable<{ id: number }> {
    return this.client
      .post<{ id: number }>(`/booking/links/${id}/delete`, {})
      .pipe(
        tap(() => {
          this.linksSubject.next(
            this.linksSubject.value.filter((link) => link.id !== id),
          );
        }),
      );
  }

  toggleLink(id: number): Observable<BookingLink> {
    return this.client
      .post<BookingLink>(`/booking/links/${id}/toggle`, {})
      .pipe(
        tap((updated) => {
          this.linksSubject.next(
            this.linksSubject.value.map((link) =>
              link.id === updated.id ? updated : link,
            ),
          );
        }),
      );
  }

  sendLink(id: number, email: string): Observable<{ email: string }> {
    return this.client.post<{ email: string }>(`/booking/links/${id}/send`, {
      email,
    });
  }

  getBySlug(slug: string): Observable<{
    link: BookingLink;
    host: BookingLinkContext["host"];
    group: BookingLinkContext["group"];
  }> {
    return this.client.get(`/booking/public/${slug}`);
  }

  getPublicIntersection(
    slug: string,
    date: string,
    durationMinutes?: number,
  ): Observable<AvailabilityIntersectionResult> {
    const params = new URLSearchParams({ date });
    if (durationMinutes != null) {
      params.set("durationMinutes", String(durationMinutes));
    }
    return this.client.get<AvailabilityIntersectionResult>(
      `/booking/public/${slug}/intersection?${params}`,
    );
  }

  bookSlot(data: {
    slug: string;
    date: string;
    startTime: string;
    endTime: string;
    guestEmail: string;
    guestName: string;
    title: string;
    description?: string;
  }): Observable<{ meetingId: number; videoUrl: string | null }> {
    return this.client.post("/booking/book", data);
  }

  cancelPublicMeeting(
    token: string,
  ): Observable<{ ok: true; alreadyCancelled: boolean }> {
    return this.client.get(`/booking/cancel/${token}`);
  }
}
