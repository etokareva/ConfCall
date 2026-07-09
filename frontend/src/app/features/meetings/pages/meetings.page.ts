import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { EMPTY, of } from "rxjs";
import { catchError, finalize, map, switchMap, tap } from "rxjs/operators";
import { MeetingService } from "../../../core/services/meeting.service";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { ModalService } from "../../../core/services/modal.service";
import { ToastService } from "../../../core/services/toast.service";
import { Meeting } from "../../../core/models/api.model";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { I18nService } from "../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { AuthService } from "../../../core/services/auth.service";

type MeetingFilter = "upcoming" | "new" | "past" | "cancelled" | "all";
type FilterOption = {
  value: MeetingFilter;
  label: string;
};

@Component({
  selector: "ccs-meetings",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavbarComponent,
    IconComponent,
    TranslatePipe,
  ],
  templateUrl: "./meetings.page.html",
  styleUrl: "./meetings.page.scss",
})
export class MeetingsPage implements OnInit {
  service = inject(MeetingService);
  auth = inject(AuthService);
  modal = inject(ModalService);
  toast = inject(ToastService);
  i18n = inject(I18nService);
  meetings = signal<Meeting[]>([]);
  highlightedMeetingIds = signal<Set<number>>(new Set());
  filter = signal<MeetingFilter>("upcoming");
  loading = signal(true);
  loadError = signal<string | null>(null);
  filterOptions: FilterOption[] = [
    { value: "upcoming", label: "meetings.filter.upcoming" },
    { value: "new", label: "meetings.filter.new" },
    { value: "past", label: "meetings.filter.past" },
    { value: "cancelled", label: "meetings.filter.cancelled" },
    { value: "all", label: "meetings.filter.all" },
  ];
  readonly upcomingCount = computed(
    () => this.meetingsForFilter(this.meetings(), "upcoming").length,
  );
  readonly newCount = computed(
    () => this.meetingsForFilter(this.meetings(), "new").length,
  );
  readonly cancelledCount = computed(
    () => this.meetingsForFilter(this.meetings(), "cancelled").length,
  );
  readonly currentUser = computed(() => this.auth.user());
  readonly currentUserId = computed(() => this.currentUser()?.id ?? null);
  readonly currentUserEmail = computed(
    () => this.currentUser()?.email?.toLowerCase() ?? null,
  );

  ngOnInit() {
    this.loadMeetings();
  }

  loadMeetings() {
    this.loading.set(true);
    this.loadError.set(null);
    this.highlightedMeetingIds.set(new Set());

    this.service
      .refreshMeetings()
      .pipe(
        switchMap((meetings) => {
          this.meetings.set(meetings);
          const newIds = meetings
            .filter(
              (meeting) => meeting.isNew && meeting.status === "scheduled",
            )
            .map((meeting) => meeting.id);

          if (!newIds.length) return of(meetings);

          this.highlightedMeetingIds.set(new Set(newIds));
          return this.service.markSeen().pipe(map(() => meetings));
        }),
        catchError(() => {
          this.loadError.set(this.i18n.translate("meetings.load_error"));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString(this.localeName(), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  formatTime(d: string) {
    return new Date(d).toLocaleTimeString(this.localeName(), {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  statusLabel(s: string) {
    return (
      (
        {
          scheduled: this.i18n.translate("meetings.status.scheduled"),
          completed: this.i18n.translate("meetings.status.completed"),
          cancelled: this.i18n.translate("meetings.status.cancelled"),
        } as Record<string, string>
      )[s] || s
    );
  }
  cancelledByLabel(meeting: Meeting) {
    return meeting.cancelledByName || meeting.cancelledByEmail || null;
  }
  isHighlighted(meeting: { id: number; isNew?: boolean }) {
    return meeting.isNew || this.highlightedMeetingIds().has(meeting.id);
  }
  isOrganizer(meeting: Meeting) {
    return meeting.organizerId === this.currentUserId();
  }
  isCurrentUserParticipant(meeting: Meeting) {
    const userId = this.currentUserId();
    const email = this.currentUserEmail();
    return meeting.participants.some(
      (participant) =>
        participant.userId === userId ||
        (email !== null && participant.email.toLowerCase() === email),
    );
  }
  currentUserParticipationStatus(meeting: Meeting) {
    const userId = this.currentUserId();
    const email = this.currentUserEmail();
    const participant = meeting.participants.find(
      (entry) =>
        entry.userId === userId ||
        (email !== null && entry.email.toLowerCase() === email),
    );
    return participant?.status ?? null;
  }
  isCurrentUserDeclined(meeting: Meeting) {
    return this.currentUserParticipationStatus(meeting) === "declined";
  }
  canDecline(meeting: Meeting) {
    return (
      meeting.status === "scheduled" &&
      !this.isOrganizer(meeting) &&
      this.isCurrentUserParticipant(meeting) &&
      this.currentUserParticipationStatus(meeting) !== "declined"
    );
  }
  filteredMeetings(meetings: Meeting[]) {
    return this.meetingsForFilter(meetings, this.filter());
  }
  filterCount(meetings: Meeting[], filter: MeetingFilter) {
    return this.meetingsForFilter(meetings, filter).length;
  }
  emptyMessage() {
    return (
      (
        {
          upcoming: this.i18n.translate("meetings.empty.upcoming"),
          new: this.i18n.translate("meetings.empty.new"),
          past: this.i18n.translate("meetings.empty.past"),
          cancelled: this.i18n.translate("meetings.empty.cancelled"),
          all: this.i18n.translate("meetings.empty.all"),
        } as Record<MeetingFilter, string>
      )[this.filter()] || this.i18n.translate("meetings.empty.fallback")
    );
  }
  emptyHint() {
    return this.filter() === "all"
      ? this.i18n.translate("meetings.empty.all_hint")
      : this.i18n.translate("meetings.empty.filtered_hint");
  }
  private meetingsForFilter(meetings: Meeting[], filter: MeetingFilter) {
    const now = Date.now();
    const filtered = meetings.filter((meeting) => {
      const start = new Date(meeting.startTime).getTime();

      switch (filter) {
        case "new":
          return (
            (meeting.isNew || this.highlightedMeetingIds().has(meeting.id)) &&
            !this.isCurrentUserDeclined(meeting)
          );
        case "past":
          return meeting.status !== "cancelled" && start < now;
        case "cancelled":
          return meeting.status === "cancelled";
        case "all":
          return true;
        case "upcoming":
        default:
          return (
            meeting.status === "scheduled" &&
            start >= now &&
            !this.isCurrentUserDeclined(meeting)
          );
      }
    });

    return filtered.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }
  filterLabel() {
    return (
      (
        {
          upcoming: this.i18n.translate("meetings.filter_label.upcoming"),
          new: this.i18n.translate("meetings.filter_label.new"),
          past: this.i18n.translate("meetings.filter_label.past"),
          cancelled: this.i18n.translate("meetings.filter_label.cancelled"),
          all: this.i18n.translate("meetings.filter_label.all"),
        } as Record<MeetingFilter, string>
      )[this.filter()] || this.i18n.translate("meetings.filter_label.all")
    );
  }
  async cancel(id: number) {
    const confirmed = await this.modal.confirm({
      title: this.i18n.translate("meetings.cancel.title"),
      message: this.i18n.translate("meetings.cancel.message"),
      confirmText: this.i18n.translate("meetings.cancel.confirm"),
    });
    if (!confirmed) return;

    this.service
      .cancel(id)
      .pipe(
        tap((updated) => {
          this.applyMeetingUpdate(updated);
          this.toast.success(
            this.i18n.translate("meetings.toast.cancelled_title"),
            this.i18n.translate("meetings.toast.cancelled_message"),
          );
        }),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("meetings.toast.cancel_error_title"),
            this.i18n.translate("meetings.toast.cancel_error_message"),
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async decline(id: number) {
    const confirmed = await this.modal.confirm({
      title: this.i18n.translate("meetings.decline.title"),
      message: this.i18n.translate("meetings.decline.message"),
      confirmText: this.i18n.translate("meetings.decline.confirm"),
    });
    if (!confirmed) return;

    this.service
      .decline(id)
      .pipe(
        tap((updated) => {
          this.applyMeetingUpdate(updated);
          this.toast.success(
            this.i18n.translate("meetings.toast.declined_title"),
            this.i18n.translate("meetings.toast.declined_message"),
          );
        }),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("meetings.toast.decline_error_title"),
            this.i18n.translate("meetings.toast.decline_error_message"),
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private applyMeetingUpdate(updated: Meeting) {
    this.meetings.update((meetings) =>
      meetings.map((meeting) =>
        meeting.id === updated.id ? updated : meeting,
      ),
    );
    this.highlightedMeetingIds.update((ids) => {
      const next = new Set(ids);
      if (updated.status !== "scheduled") {
        next.delete(updated.id);
      }
      return next;
    });
  }

  private localeName() {
    return this.i18n.locale() === "zh" ? "zh-CN" : this.i18n.locale();
  }
}
