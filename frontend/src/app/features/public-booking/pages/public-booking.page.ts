import { Component, DestroyRef, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { EMPTY, forkJoin, of } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  tap,
} from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BookingService } from "../../../core/services/booking.service";
import {
  AvailableSlot,
  UserSummary,
  BookingLinkContext,
} from "../../../core/models/api.model";
import { ToastService } from "../../../core/services/toast.service";
import { I18nService } from "../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { DateInputComponent } from "../../../shared/components/date-input/date-input.component";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { TooltipDirective } from "../../../shared/components/tooltip/tooltip.directive";

@Component({
  selector: "ccs-public-booking",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    DateInputComponent,
    IconComponent,
    TooltipDirective,
  ],
  templateUrl: "./public-booking.page.html",
  styleUrl: "./public-booking.page.scss",
})
export class PublicBookingPage implements OnInit {
  route = inject(ActivatedRoute);
  bookingService = inject(BookingService);
  toast = inject(ToastService);
  i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  slug = signal("");
  loading = signal(true);
  error = signal(false);
  errorMessage = signal("");
  host = signal<UserSummary | null>(null);
  group = signal<BookingLinkContext["group"]>(null);
  linkTitle = signal("");
  linkDesc = signal<string | null>(null);
  duration = signal(30);

  date = signal(this.tomorrow());
  readonly dateControl = new FormControl(this.tomorrow(), {
    nonNullable: true,
  });
  readonly guestForm = new FormGroup({
    guestName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    guestEmail: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    meetingTitle: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });
  slots = signal<AvailableSlot[]>([]);
  availableDates = signal<string[]>([]);
  loadingAvailableDates = signal(false);
  finding = signal(false);
  selectedSlot = signal<AvailableSlot | null>(null);
  booking = signal(false);
  success = signal(false);
  videoUrl = signal<string | null>(null);
  readonly hostAvatarLoadFailed = signal(false);
  readonly groupAvatarLoadFailed = signal(false);

  minDate = new Date().toISOString().split("T")[0];

  constructor() {
    this.dateControl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((date) => {
        this.date.set(date);
        if (this.host()) this.loadSlots();
      });
  }

  ngOnInit() {
    const s = this.route.snapshot.paramMap.get("userId");
    if (!s) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.slug.set(s);
    this.loadLinkContext();
  }

  reloadLink() {
    this.loadLinkContext();
  }

  private loadLinkContext() {
    this.loading.set(true);
    this.error.set(false);
    this.errorMessage.set("");
    this.bookingService
      .getBySlug(this.slug())
      .pipe(
        tap((d) => {
          this.host.set(d.host);
          this.group.set(d.group);
          this.hostAvatarLoadFailed.set(false);
          this.groupAvatarLoadFailed.set(false);
          this.linkTitle.set(d.link.title);
          this.linkDesc.set(d.link.description);
          this.duration.set(d.link.durationMinutes);
          this.loadSlots();
          this.loadAvailableDates();
        }),
        catchError((error) => {
          this.error.set(true);
          this.errorMessage.set(
            error.message ||
              this.i18n.translate("public_booking.link_not_found"),
          );
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  private tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  showHostAvatar() {
    const avatar = this.host()?.avatar?.trim();
    return Boolean(avatar) && !this.hostAvatarLoadFailed();
  }

  onHostAvatarLoadError() {
    this.hostAvatarLoadFailed.set(true);
  }

  showGroupAvatar() {
    const avatar = this.group()?.avatar?.trim();
    return Boolean(avatar) && !this.groupAvatarLoadFailed();
  }

  onGroupAvatarLoadError() {
    this.groupAvatarLoadFailed.set(true);
  }

  loadSlots() {
    if (!this.host()) return;
    this.finding.set(true);
    this.selectedSlot.set(null);
    this.bookingService
      .getPublicIntersection(this.slug(), this.date(), this.duration())
      .pipe(
        tap((r) => this.slots.set(r.availableSlots)),
        catchError(() => {
          this.slots.set([]);
          return EMPTY;
        }),
        finalize(() => this.finding.set(false)),
      )
      .subscribe();
  }

  loadAvailableDates() {
    if (!this.host()) return;

    const dates = this.buildDateWindow(60);
    this.loadingAvailableDates.set(true);
    forkJoin(
      dates.map((date) =>
        this.bookingService
          .getPublicIntersection(this.slug(), date, this.duration())
          .pipe(
            map((result) => ({
              date,
              hasSlots: result.availableSlots.length > 0,
            })),
            catchError(() => of({ date, hasSlots: false })),
          ),
      ),
    )
      .pipe(
        tap((results) => {
          this.availableDates.set(
            results.filter(({ hasSlots }) => hasSlots).map(({ date }) => date),
          );
        }),
        finalize(() => this.loadingAvailableDates.set(false)),
      )
      .subscribe();
  }

  book() {
    if (this.guestForm.invalid || !this.selectedSlot()) {
      this.guestForm.markAllAsTouched();
      return;
    }

    this.booking.set(true);
    const slot = this.selectedSlot()!;
    const { guestEmail, guestName, meetingTitle } =
      this.guestForm.getRawValue();
    this.bookingService
      .bookSlot({
        slug: this.slug(),
        date: this.date(),
        startTime: slot.start,
        endTime: slot.end,
        guestEmail: guestEmail.trim(),
        guestName: guestName.trim(),
        title: meetingTitle.trim(),
      })
      .pipe(
        tap((r) => {
          this.success.set(true);
          this.videoUrl.set(r.videoUrl);
          this.toast.success(
            this.i18n.translate("public_booking.toast.booked_title"),
            this.i18n.translate("public_booking.toast.booked_message"),
          );
        }),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("public_booking.toast.error_title"),
            this.i18n.translate("public_booking.toast.error_message"),
          );
          return EMPTY;
        }),
        finalize(() => this.booking.set(false)),
      )
      .subscribe();
  }

  private buildDateWindow(days: number) {
    return Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return date.toISOString().split("T")[0];
    });
  }
}
