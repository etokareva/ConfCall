import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  ViewChild,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EMPTY, firstValueFrom } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  tap,
} from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Dialog } from "@angular/cdk/dialog";
import { OverlayModule, ConnectedPosition } from "@angular/cdk/overlay";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { DateInputComponent } from "../../../shared/components/date-input/date-input.component";
import { SelectableCardGridComponent } from "../../../shared/components/selectable-card-grid/selectable-card-grid.component";
import { BookingDialogComponent } from "../components/booking-dialog/booking-dialog.component";
import {
  BookingDialogData,
  BookingDialogResult,
} from "../models/booking-dialog.model";
import { AvailabilityService } from "../../../core/services/availability.service";
import { MeetingService } from "../../../core/services/meeting.service";
import { GroupService } from "../../../core/services/group.service";
import { BookingService } from "../../../core/services/booking.service";
import { ToastService } from "../../../core/services/toast.service";
import { TooltipDirective } from "../../../shared/components/tooltip/tooltip.directive";
import { I18nService } from "../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import {
  UserGroup,
  UserWithAvailability,
  AvailableSlot,
  AvailableRange,
} from "../../../core/models/api.model";
import { SelectableCardItem } from "../../../shared/models/selectable-card.model";

type BookStepId = "group" | "participants" | "params";
type BookDateMode = "single" | "range";
type BookingMode = "internal" | "public";

interface BookStep {
  id: BookStepId;
  title: string;
  description: string;
}

interface DayIntersection {
  date: string;
  availableSlots: AvailableSlot[];
  availableRanges: AvailableRange[];
  messageKey: string | null;
  unavailableUserIds?: number[];
}

@Component({
  selector: "ccs-book",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    NavbarComponent,
    IconComponent,
    DateInputComponent,
    SelectableCardGridComponent,
    TooltipDirective,
    TranslatePipe,
  ],
  templateUrl: "./book.page.html",
  styleUrl: "./book.page.scss",
})
export class BookPage {
  avail = inject(AvailabilityService);
  meetings = inject(MeetingService);
  groups = inject(GroupService);
  booking = inject(BookingService);
  toast = inject(ToastService);
  i18n = inject(I18nService);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild("durationButton") durationButton?: ElementRef<HTMLButtonElement>;

  users = signal<UserWithAvailability[]>([]);
  groupsList = signal<UserGroup[]>([]);
  groupsLoading = signal(true);
  groupUsersLoading = signal(false);
  groupsError = signal<string | null>(null);
  groupUsersError = signal<string | null>(null);
  selectedGroupId = signal<number | null>(null);
  currentStep = signal<BookStepId>("group");
  groupSearch = signal("");
  participantSearch = signal("");
  selectedIds = signal<number[]>([]);
  bookingMode = signal<BookingMode>("internal");
  searchMode = signal<BookDateMode>("single");
  selectedDate = signal(this.tomorrow());
  selectedRangeStart = signal(this.tomorrow());
  selectedRangeEnd = signal(this.tomorrow());
  dateError = signal<string | null>(null);
  duration = signal<number | null>(null);
  durationOpen = signal(false);
  durationMenuWidth = signal(0);
  slots = signal<AvailableSlot[]>([]);
  availableRanges = signal<AvailableRange[]>([]);
  availableDates = signal<string[]>([]);
  availableDatesLoading = signal(false);
  rangeResults = signal<DayIntersection[]>([]);
  finding = signal(false);
  creatingLink = signal(false);
  error = signal<string | null>(null);
  hasSearched = signal(false);
  readonly bookSteps: BookStep[] = [
    {
      id: "group",
      title: "book.step.group.title",
      description: "book.step.group.description",
    },
    {
      id: "participants",
      title: "book.step.participants.title",
      description: "book.step.participants.description",
    },
    {
      id: "params",
      title: "book.step.params.title",
      description: "book.step.params.description",
    },
  ];
  readonly activeStep = computed<BookStepId>(() => {
    const currentStep = this.currentStep();
    return this.isStepAvailable(currentStep) ? currentStep : "group";
  });
  readonly activeStepNumber = computed(
    () => this.bookSteps.findIndex((step) => step.id === this.activeStep()) + 1,
  );
  readonly nextStep = computed<BookStepId | null>(() => {
    const index = this.bookSteps.findIndex(
      (step) => step.id === this.activeStep(),
    );
    return this.bookSteps[index + 1]?.id ?? null;
  });
  readonly canGoNext = computed(() => {
    const nextStep = this.nextStep();
    return Boolean(nextStep && this.isStepAvailable(nextStep));
  });
  readonly filteredGroups = computed(() => {
    const query = this.groupSearch().trim().toLowerCase();
    if (!query) return this.groupsList();

    return this.groupsList().filter((group) =>
      group.name.toLowerCase().includes(query),
    );
  });
  readonly groupItems = computed<SelectableCardItem[]>(() =>
    this.filteredGroups().map(({ id, name, avatar, members }) => ({
      id,
      title: name,
      subtitle: this.i18n.translate("groups.members_count", {
        count: members.length,
      }),
      avatar,
      fallbackText: name,
    })),
  );
  readonly selectedGroupIds = computed(() => {
    const groupId = this.selectedGroupId();
    return groupId ? [groupId] : [];
  });
  readonly filteredUsers = computed(() => {
    const query = this.participantSearch().trim().toLowerCase();
    if (!query) return this.users();

    return this.users().filter((user) =>
      `${user.name ?? ""} ${user.email ?? ""}`.toLowerCase().includes(query),
    );
  });
  readonly userItems = computed<SelectableCardItem[]>(() =>
    this.filteredUsers().map(({ id, name, email, avatar }) => ({
      id,
      title: name || email || "",
      subtitle: email || undefined,
      avatar,
      fallbackText: name || email || "?",
    })),
  );
  readonly allVisibleUsersSelected = computed(() => {
    const visibleUsers = this.filteredUsers();
    if (visibleUsers.length === 0) return false;

    const selectedIds = new Set(this.selectedIds());
    return visibleUsers.every((user) => selectedIds.has(user.id));
  });
  readonly groupHelpText = computed(() => {
    const group = this.selectedGroup();
    if (!group) return this.i18n.translate("book.group_help.empty");
    return `${this.i18n.translate("book.group_help.selected_prefix")} «${group.name}».`;
  });
  readonly selectedGroup = computed(
    () =>
      this.groupsList().find((group) => group.id === this.selectedGroupId()) ??
      null,
  );
  readonly selectedUsersLabel = computed(() => {
    const count = this.selectedIds().length;
    if (count === 0) return this.i18n.translate("book.participants.none");
    return this.i18n
      .translate("book.participants.count")
      .replace("{count}", `${count}`);
  });
  readonly selectedParticipantsSummary = computed(() => {
    const users = this.selectedUsers();
    if (users.length === 0) {
      return this.i18n.translate("book.participants.none");
    }

    if (users.length === 1) {
      const { name, email } = users[0];
      return [name || email, name && email ? email : ""]
        .filter(Boolean)
        .join(" · ");
    }

    return this.i18n
      .translate("book.participants.count")
      .replace("{count}", `${users.length}`);
  });
  readonly singleSelectedUser = computed(() => {
    const users = this.selectedUsers();
    return users.length === 1 ? users[0] : null;
  });
  readonly singleParticipantHint = computed(() => {
    const user = this.singleSelectedUser();
    if (!user) return "";

    const displayName = user.name || user.email || "";
    return this.i18n
      .translate("book.single_participant_hint")
      .replace("{name}", displayName);
  });
  readonly selectedPeriodLabel = computed(() => {
    if (
      this.searchMode() === "range" &&
      this.selectedRangeEnd() > this.selectedRangeStart()
    ) {
      return `${this.selectedDateLabel(this.selectedRangeStart())} - ${this.selectedDateLabel(this.selectedRangeEnd())}`;
    }
    return this.selectedDateLabel(
      this.searchMode() === "range"
        ? this.selectedRangeStart()
        : this.selectedDate(),
    );
  });
  readonly resultTitle = computed(() => {
    if (this.selectedUsers().length === 1) {
      return this.i18n.translate("book.single_participant_slots");
    }
    const count = this.slots().length;
    if (count === 0) return this.i18n.translate("book.suitable_options");
    return this.i18n
      .translate("book.options_found")
      .replace("{count}", `${count}`);
  });
  readonly rangesTitle = computed(() => {
    if (this.selectedUsers().length === 1) {
      return this.i18n.translate("book.single_participant_ranges");
    }
    const count = this.availableRanges().length;
    if (count === 0) return this.i18n.translate("book.shared_free_ranges");
    return this.i18n.translate("book.time_matches");
  });
  readonly rangeResultsTitle = computed(() => {
    if (this.selectedUsers().length === 1) {
      return this.i18n.translate("book.single_participant_by_day");
    }
    return this.i18n.translate("book.time_matches_by_day");
  });
  readonly rangeResultsDescription = computed(() => {
    if (this.selectedUsers().length === 1) {
      return this.i18n.translate("book.single_participant_by_day_description");
    }
    return this.i18n.translate("book.time_matches_by_day_description");
  });
  readonly rangesDescription = computed(() => {
    if (this.selectedUsers().length === 1) {
      return this.i18n.translate("book.single_participant_ranges_description");
    }
    return this.i18n.translate("book.ranges_description");
  });
  readonly sortedAvailableRanges = computed(() =>
    [...this.availableRanges()].sort((a, b) => {
      if (a.start === b.start) return a.end.localeCompare(b.end);
      return a.start.localeCompare(b.start);
    }),
  );
  readonly sortedSlots = computed(() =>
    [...this.slots()].sort((a, b) => {
      if (a.start === b.start) return a.end.localeCompare(b.end);
      return a.start.localeCompare(b.start);
    }),
  );
  readonly searchModeControl = new FormControl<BookDateMode>("single", {
    nonNullable: true,
  });
  readonly singleDateControl = new FormControl(this.selectedDate(), {
    nonNullable: true,
  });
  readonly rangeStartControl = new FormControl(this.selectedRangeStart(), {
    nonNullable: true,
  });
  readonly rangeEndControl = new FormControl(this.selectedRangeEnd(), {
    nonNullable: true,
  });
  readonly durationControl = new FormControl<number | null>(null);
  readonly searchForm = new FormGroup({
    mode: this.searchModeControl,
    singleDate: this.singleDateControl,
    rangeStart: this.rangeStartControl,
    rangeEnd: this.rangeEndControl,
    duration: this.durationControl,
  });
  readonly minDate = this.toIsoDate(new Date());
  private readonly durationOverlayGapPx = 8;
  private availableDatesQueryKey = "";
  private readonly availableDatesWindowDays = 60;
  durationOptions = [
    { value: null, label: "duration.any" },
    { value: 30, label: "duration.30" },
    { value: 45, label: "duration.45" },
    { value: 60, label: "duration.60" },
    { value: 90, label: "duration.90" },
    { value: 120, label: "duration.120" },
  ];
  readonly localizedDurationOptions = computed(() =>
    this.durationOptions.map((option) => ({
      ...option,
      label: this.i18n.translate(option.label),
    })),
  );
  readonly hasIntersections = computed(
    () =>
      this.availableRanges().length > 0 ||
      this.slots().length > 0 ||
      this.rangeResults().some(
        (day) =>
          day.availableRanges.length > 0 || day.availableSlots.length > 0,
      ),
  );
  durationOverlayPositions: ConnectedPosition[] = [
    {
      originX: "start",
      originY: "bottom",
      overlayX: "start",
      overlayY: "top",
      offsetY: this.durationOverlayGapPx,
    },
    {
      originX: "start",
      originY: "top",
      overlayX: "start",
      overlayY: "bottom",
      offsetY: -this.durationOverlayGapPx,
    },
  ];

  constructor() {
    this.groups
      .loadGroups()
      .pipe(
        tap((groups) => {
          this.groupsList.set(groups);
          if (!this.selectedGroupId() && groups.length > 0) {
            this.selectedGroupId.set(groups[0].id);
          }
          if (groups.length > 0) {
            this.loadGroupUsers(groups[0].id, false);
          }
        }),
        catchError(() => {
          this.groupsError.set(this.i18n.translate("book.groups_load_error"));
          this.toast.error(
            this.i18n.translate("book.toast.groups_unavailable_title"),
            this.i18n.translate("book.toast.groups_unavailable_message"),
          );
          return EMPTY;
        }),
        finalize(() => {
          this.groupsLoading.set(false);
        }),
      )
      .subscribe();
    this.bindSearchForm();
  }

  setSearchMode(mode: BookDateMode) {
    if (mode === this.searchMode()) {
      return;
    }

    if (mode === "single") {
      const nextValue =
        this.rangeStartControl.value ||
        this.selectedRangeStart() ||
        this.selectedDate();
      this.searchForm.patchValue(
        {
          mode,
          singleDate: nextValue,
        },
        { emitEvent: false },
      );
      this.syncSearchFormAfterModeChange();
      return;
    }

    const nextStart = this.singleDateControl.value || this.selectedDate();
    this.searchForm.patchValue(
      {
        mode,
        rangeStart: nextStart,
        rangeEnd: nextStart,
      },
      { emitEvent: false },
    );
    this.syncSearchFormAfterModeChange();
  }

  private tomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return this.toIsoDate(d);
  }

  private bindSearchForm() {
    this.searchForm.valueChanges
      .pipe(
        tap(() => {
          this.syncSearchFormValue();
          this.dateError.set(this.validateSearchForm());
          this.clearSearchResults();
        }),
        debounceTime(250),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
        ),
        tap(() => this.findSlots(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private syncSearchFormValue() {
    const value = this.searchForm.getRawValue();
    this.searchMode.set(value.mode);
    this.selectedDate.set(value.singleDate);
    this.selectedRangeStart.set(value.rangeStart);
    this.selectedRangeEnd.set(value.rangeEnd);
    this.duration.set(value.duration);
  }

  private syncSearchFormAfterModeChange() {
    this.syncSearchFormValue();
    this.dateError.set(this.validateSearchForm());
    this.clearSearchResults();
  }

  private validateSearchForm() {
    const { mode, singleDate, rangeStart, rangeEnd } =
      this.searchForm.getRawValue();
    if (mode === "single") {
      return this.validateSingleDate(singleDate);
    }
    return this.validateRangeDates(rangeStart, rangeEnd);
  }

  private validateSingleDate(value: string) {
    if (!value) {
      return this.i18n.translate("book.date_error.invalid");
    }

    if (value < this.minDate) {
      return this.i18n.translate("book.date_error.past");
    }

    return null;
  }

  private validateRangeDates(start: string, end: string) {
    if (!start || !end) {
      return this.i18n.translate("book.date_error.invalid");
    }

    if (start < this.minDate || end < this.minDate) {
      return this.i18n.translate("book.date_error.past");
    }

    if (end < start) {
      return this.i18n.translate("book.date_error.range");
    }

    return null;
  }

  private getInclusiveDateRangeDays(start: string, end: string) {
    const startTime = new Date(`${start}T00:00:00`).getTime();
    const endTime = new Date(`${end}T00:00:00`).getTime();
    return Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
  }

  private selectedRangeDays() {
    const start = this.selectedRangeStart();
    const end = this.selectedRangeEnd();

    if (!start || !end || end < start) {
      return undefined;
    }

    return this.getInclusiveDateRangeDays(start, end);
  }

  private clearSearchResults() {
    this.slots.set([]);
    this.availableRanges.set([]);
    this.rangeResults.set([]);
    this.hasSearched.set(false);
    this.error.set(null);
  }

  isStepAvailable(stepId: BookStepId) {
    if (stepId === "group") return true;
    if (stepId === "participants") return Boolean(this.selectedGroupId());
    if (stepId === "params") return this.selectedIds().length > 0;
    return this.hasSearched();
  }

  goToStep(stepId: BookStepId) {
    if (!this.isStepAvailable(stepId)) return;
    this.currentStep.set(stepId);
    if (stepId === "params") {
      this.loadAvailableDates();
      this.findSlots(false);
    }
  }

  goToNextStep() {
    const nextStep = this.nextStep();
    if (!nextStep || !this.isStepAvailable(nextStep)) return;
    this.currentStep.set(nextStep);
    if (nextStep === "params") {
      this.loadAvailableDates();
      this.findSlots(false);
    }
  }

  toggleDuration() {
    if (this.durationOpen()) {
      this.closeDuration();
      return;
    }

    this.updateDurationMenuWidth();
    this.durationOpen.set(true);
  }

  closeDuration() {
    this.durationOpen.set(false);
  }

  selectDuration(value: number | null) {
    this.durationControl.setValue(value);
    this.availableDatesQueryKey = "";
    this.loadAvailableDates();
    this.closeDuration();
  }

  selectBookingMode(mode: BookingMode) {
    this.bookingMode.set(mode);
  }

  durationLabel() {
    const current = this.duration();
    if (current === null) {
      return this.i18n.translate("book.duration_any");
    }

    const label =
      this.durationOptions.find((option) => option.value === current)?.label ||
      "duration.custom";
    return this.i18n.translate(label).replace("{count}", `${current}`);
  }

  private updateDurationMenuWidth() {
    const trigger = this.durationButton?.nativeElement;
    if (!trigger) return;

    this.durationMenuWidth.set(trigger.getBoundingClientRect().width);
  }

  selectedDateLabel(iso = this.selectedDate()) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(
      this.i18n.locale() === "zh" ? "zh-CN" : this.i18n.locale(),
      {
        day: "numeric",
        month: "long",
        weekday: "long",
      },
    );
  }

  findDisabledReason() {
    if (this.finding()) return this.i18n.translate("book.disabled.searching");
    if (this.groupsError())
      return this.i18n.translate("book.disabled.groups_unavailable");
    if (!this.selectedGroupId())
      return this.i18n.translate("book.disabled.choose_group");
    if (this.groupUsersError())
      return this.i18n.translate("book.disabled.members_unavailable");
    if (this.selectedIds().length === 0)
      return this.i18n.translate("book.disabled.choose_participants");
    if (this.dateError()) return this.dateError();
    return null;
  }

  stepCaption(stepId: BookStepId) {
    if (stepId === "group") {
      return this.selectedGroup()?.name ?? this.i18n.translate("book.group");
    }
    if (stepId === "participants") {
      return this.selectedUsersLabel();
    }
    if (stepId === "params") {
      if (this.selectedIds().length === 0) {
        return this.i18n.translate("book.step.params.description");
      }
      return `${this.selectedPeriodLabel()} • ${this.durationLabel()}`;
    }
    return this.i18n.translate("book.step.params.description");
  }

  stepState(stepId: BookStepId) {
    if (stepId === this.activeStep()) return "active";
    if (stepId === "group" && this.selectedGroupId()) {
      return "done";
    }
    if (stepId === "participants" && this.selectedIds().length > 0) {
      return "done";
    }
    if (stepId === "params" && this.hasSearched()) return "done";
    return "idle";
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private addDays(dateKey: string, days: number) {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + days);
    return this.toIsoDate(date);
  }

  private loadAvailableDates() {
    const groupId = this.selectedGroupId();
    const userIds = this.selectedIds();
    if (
      this.activeStep() !== "params" ||
      !groupId ||
      userIds.length === 0 ||
      this.dateError()
    ) {
      this.availableDates.set([]);
      this.availableDatesQueryKey = "";
      return;
    }

    const duration = this.duration();
    const startDate = this.minDate;
    const endDate = this.addDays(startDate, this.availableDatesWindowDays);
    const queryKey = JSON.stringify({
      groupId,
      userIds: [...userIds].sort((a, b) => a - b),
      duration,
      startDate,
      endDate,
    });
    if (queryKey === this.availableDatesQueryKey) {
      return;
    }

    this.availableDatesQueryKey = queryKey;
    this.availableDatesLoading.set(true);
    this.avail
      .getIntersectionRange(
        userIds,
        startDate,
        endDate,
        duration ?? undefined,
        groupId,
      )
      .pipe(
        tap((result) => {
          this.availableDates.set(
            result.days
              .filter(
                (day) =>
                  day.availableSlots.length > 0 ||
                  day.availableRanges.length > 0,
              )
              .map((day) => day.date),
          );
        }),
        catchError(() => {
          this.availableDates.set([]);
          this.availableDatesQueryKey = "";
          return EMPTY;
        }),
        finalize(() => this.availableDatesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  toggleUser(id: number) {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
    this.clearSearchResults();
    this.availableDatesQueryKey = "";
    this.loadAvailableDates();
    if (this.activeStep() === "params" && this.selectedIds().length > 0) {
      this.findSlots(false);
    }
  }

  toggleVisibleUsers() {
    const visibleUsers = this.filteredUsers();
    if (visibleUsers.length === 0) return;

    const visibleIds = new Set(visibleUsers.map((user) => user.id));
    if (this.allVisibleUsersSelected()) {
      this.selectedIds.update((ids) => ids.filter((id) => !visibleIds.has(id)));
    } else {
      this.selectedIds.update((ids) => {
        const next = new Set(ids);
        visibleUsers.forEach((user) => next.add(user.id));
        return [...next];
      });
    }
    this.clearSearchResults();
    this.availableDatesQueryKey = "";
    this.loadAvailableDates();
    if (this.activeStep() === "params" && this.selectedIds().length > 0) {
      this.findSlots(false);
    }
  }

  openPublicBookingLinkDialog() {
    const groupId = this.selectedGroupId();
    const participantIds = this.selectedIds();
    const group = this.selectedGroup();
    if (!groupId || !group || participantIds.length === 0) {
      this.toast.info(
        this.i18n.translate("groups.select_group_first_title"),
        this.i18n.translate("book.disabled.choose_participants"),
      );
      return;
    }

    if (!this.hasIntersections()) {
      this.toast.info(
        this.i18n.translate("book.public_link_unavailable_title"),
        this.i18n.translate("book.public_link_unavailable_message"),
      );
      return;
    }

    const data: BookingDialogData = {
      mode: "public-link",
      dateLabel: this.selectedPeriodLabel(),
      defaultTitle: group.name,
      defaultDescription: "",
      defaultDurationMinutes: this.duration() ?? 30,
      groupName: group.name,
      participantsLabel: this.selectedParticipantsSummary(),
    };

    const dialogRef = this.dialog.open<
      BookingDialogResult,
      BookingDialogData,
      BookingDialogComponent
    >(BookingDialogComponent, {
      data,
      hasBackdrop: true,
      ariaModal: true,
      autoFocus: "first-tabbable",
      restoreFocus: true,
      width: "560px",
      maxWidth: "calc(100vw - 2rem)",
      backdropClass: "app-dialog-backdrop",
      panelClass: "ccs-dialog-panel",
    });

    dialogRef.closed
      .pipe(
        filter((result): result is BookingDialogResult => Boolean(result)),
        tap(() => this.creatingLink.set(true)),
        switchMap((result) =>
          this.booking.createLink({
            groupId,
            participantIds,
            title: result.title,
            description: result.description,
            durationMinutes: result.durationMinutes ?? 30,
          }),
        ),
        tap((link) => {
          this.toast.success(
            this.i18n.translate("settings.toast.link_created_title"),
            this.i18n.translate("settings.toast.link_created_message"),
          );
          this.openPublicBookingLink(link.slug);
        }),
        catchError((error) => {
          this.toast.error(
            this.i18n.translate("settings.toast.link_create_error_title"),
            error.message || this.i18n.translate("common.check_data_retry"),
          );
          return EMPTY;
        }),
        finalize(() => this.creatingLink.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  openPublicBookingLink(slug: string) {
    window.open(this.publicBookingUrl(slug), "_blank", "noopener,noreferrer");
  }

  publicBookingUrl(slug: string) {
    return `${window.location.origin}/book/${slug}`;
  }

  selectGroup(groupId: number) {
    if (groupId === this.selectedGroupId()) return;

    this.selectedGroupId.set(groupId);
    this.selectedIds.set([]);
    this.users.set([]);
    this.availableDates.set([]);
    this.availableDatesQueryKey = "";
    this.clearSearchResults();
    this.loadGroupUsers(groupId, true);
  }

  private loadGroupUsers(groupId: number, showSelectionToast: boolean) {
    const group = this.groupsList().find((item) => item.id === groupId);
    this.groupUsersError.set(null);
    this.groupUsersLoading.set(true);
    this.groups
      .getGroupUsers(groupId)
      .pipe(
        tap((users) => {
          this.users.set(users);
          if (group && showSelectionToast) {
            this.toast.info(
              this.i18n.translate("book.toast.group_changed_title"),
              `${this.i18n.translate("book.toast.group_changed_message")} «${group.name}».`,
            );
          }
        }),
        catchError(() => {
          this.groupUsersError.set(
            this.i18n.translate("book.group_users_error"),
          );
          this.toast.error(
            this.i18n.translate("book.toast.members_unavailable_title"),
            this.i18n.translate("book.toast.members_unavailable_message"),
          );
          return EMPTY;
        }),
        finalize(() => this.groupUsersLoading.set(false)),
      )
      .subscribe();
  }

  onGroupSearch(event: Event) {
    this.groupSearch.set((event.target as HTMLInputElement).value);
  }

  onParticipantSearch(event: Event) {
    this.participantSearch.set((event.target as HTMLInputElement).value);
  }

  selectedUsers() {
    const ids = new Set(this.selectedIds());
    return this.users().filter((user) => ids.has(user.id));
  }

  findSlots(showToast = true) {
    this.syncSearchFormValue();
    this.dateError.set(this.validateSearchForm());
    if (!showToast && this.finding()) {
      return;
    }

    const disabledReason = this.findDisabledReason();
    if (disabledReason) {
      this.error.set(disabledReason);
      if (showToast) {
        this.toast.info(
          this.i18n.translate("book.toast.search_unavailable"),
          disabledReason,
        );
      }
      return;
    }
    if (this.selectedIds().length === 0) {
      this.error.set(this.i18n.translate("book.disabled.choose_participants"));
      return;
    }
    this.clearSearchResults();
    if (this.dateError()) {
      this.error.set(this.dateError());
      return;
    }

    this.finding.set(true);
    this.error.set(null);
    this.hasSearched.set(true);
    if (this.searchMode() === "range") {
      this.avail
        .getIntersectionRange(
          this.selectedIds(),
          this.selectedRangeStart(),
          this.selectedRangeEnd(),
          this.duration() ?? undefined,
          this.selectedGroupId() ?? undefined,
          this.selectedRangeDays(),
        )
        .pipe(
          tap((result) => {
            this.slots.set([]);
            this.availableRanges.set([]);
            this.rangeResults.set(
              result.days.filter(
                (day) =>
                  day.availableSlots.length > 0 ||
                  day.availableRanges.length > 0,
              ),
            );
            if (result.messageKey) {
              this.error.set(this.i18n.translate(result.messageKey));
            }
          }),
          catchError((e) => {
            this.error.set(e.message || this.i18n.translate("book.find_error"));
            return EMPTY;
          }),
          finalize(() => this.finding.set(false)),
        )
        .subscribe();
      return;
    }

    this.slots.set([]);
    this.availableRanges.set([]);
    this.rangeResults.set([]);
    this.avail
      .getIntersection(
        this.selectedIds(),
        this.selectedDate(),
        this.duration() ?? undefined,
        this.selectedGroupId() ?? undefined,
      )
      .pipe(
        tap((r) => {
          this.slots.set(r.availableSlots);
          this.availableRanges.set(r.availableRanges ?? []);
          if (r.messageKey) {
            this.error.set(
              r.messageKey === "availability.intersection.no_availability"
                ? this.noAvailabilityMessage(r.unavailableUserIds)
                : this.i18n.translate(r.messageKey),
            );
          }
        }),
        catchError((e) => {
          this.error.set(e.message || this.i18n.translate("book.find_error"));
          return EMPTY;
        }),
        finalize(() => this.finding.set(false)),
      )
      .subscribe();
  }

  openBooking(slot: AvailableSlot, dateIso = this.selectedDate()) {
    this.error.set(null);

    void this.openBookingDialog(slot, dateIso);
  }

  rangeDurationLabel(range: AvailableRange) {
    const hours = Math.floor(range.durationMinutes / 60);
    const minutes = range.durationMinutes % 60;
    if (hours === 0) {
      return this.i18n
        .translate("duration.minutes_short")
        .replace("{count}", `${minutes}`);
    }
    if (minutes === 0) {
      return this.i18n
        .translate("duration.hours_short")
        .replace("{count}", `${hours}`);
    }
    return this.i18n
      .translate("duration.hours_minutes_short")
      .replace("{hours}", `${hours}`)
      .replace("{minutes}", `${minutes}`);
  }

  rangeDaySummaryLabel(day: DayIntersection) {
    if (this.duration() === null) {
      if (this.selectedUsers().length === 1) {
        return this.i18n.translate("book.single_participant_ranges");
      }
      return this.i18n.translate("book.shared_free_ranges");
    }

    if (day.availableSlots.length === 0) {
      return this.i18n.translate("book.no_suitable_slots");
    }

    return this.i18n
      .translate("book.options_found")
      .replace("{count}", `${day.availableSlots.length}`);
  }

  noAvailabilityMessage(unavailableUserIds?: number[]) {
    const selectedUsers = this.selectedUsers();
    const { length } = selectedUsers;
    if (length === 0) {
      return this.i18n.translate("availability.intersection.no_availability");
    }

    if (length === 1) {
      const user = selectedUsers[0];
      const name =
        user.name ||
        user.email ||
        this.i18n.translate("book.participants.none");
      return this.i18n
        .translate("availability.intersection.no_availability_single")
        .replace("{name}", name);
    }

    const missingIds = new Set(unavailableUserIds ?? []);
    if (missingIds.size >= length) {
      return this.i18n.translate(
        "availability.intersection.no_availability_all",
      );
    }

    return this.i18n.translate(
      "availability.intersection.no_availability_some",
    );
  }

  private async openBookingDialog(slot: AvailableSlot, dateIso: string) {
    const ref = this.dialog.open<
      BookingDialogResult,
      BookingDialogData,
      BookingDialogComponent
    >(BookingDialogComponent, {
      data: {
        mode: "meeting",
        dateLabel: this.selectedDateLabel(dateIso),
        start: slot.start,
        end: slot.end,
        durationLabel: this.meetingDialogDurationLabel(slot),
        groupName: this.selectedGroup()?.name ?? "",
        participantsLabel: this.selectedParticipantsSummary(),
        defaultTitle: this.i18n.translate("book.default_meeting_title"),
        defaultDescription: "",
      },
      hasBackdrop: true,
      ariaModal: true,
      autoFocus: "dialog",
      restoreFocus: true,
      disableClose: false,
      width: "500px",
      maxWidth: "calc(100vw - 2rem)",
      backdropClass: "app-dialog-backdrop",
      panelClass: "ccs-dialog-panel",
    });

    const result = await firstValueFrom(ref.closed);
    if (!result?.title) return;

    await this.createMeeting(slot, result, dateIso);
  }

  private async createMeeting(
    slot: AvailableSlot,
    result: BookingDialogResult,
    dateIso: string,
  ) {
    try {
      await firstValueFrom(
        this.meetings.create({
          title: result.title,
          description: result.description,
          startTime: new Date(`${dateIso}T${slot.start}:00`).toISOString(),
          endTime: new Date(`${dateIso}T${slot.end}:00`).toISOString(),
          participantEmails: this.selectedIds()
            .map((id) => this.users().find((u) => u.id === id)?.email || "")
            .filter((e) => e),
          groupId: this.selectedGroupId() ?? undefined,
        }),
      );

      void this.findSlots(false);
      this.toast.success(
        this.i18n.translate("book.toast.meeting_created_title"),
        this.i18n.translate("book.toast.meeting_created_message"),
      );
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : this.i18n.translate("book.create_meeting_error");
      this.error.set(message);
      void this.toast.error(
        this.i18n.translate("book.toast.create_meeting_error_title"),
        message || this.i18n.translate("common.try_again"),
      );
    }
  }

  private slotDurationLabel(slot: AvailableSlot) {
    const durationMinutes =
      this.timeToMinutes(slot.end) - this.timeToMinutes(slot.start);
    return this.rangeDurationLabel({
      start: slot.start,
      end: slot.end,
      durationMinutes,
    });
  }

  private meetingDialogDurationLabel(slot: AvailableSlot) {
    return this.durationControl.value === null
      ? this.slotDurationLabel(slot)
      : this.durationLabel();
  }

  private timeToMinutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }
}
