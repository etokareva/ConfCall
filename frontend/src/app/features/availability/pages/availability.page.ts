import { CommonModule } from "@angular/common";
import { Component, ElementRef, computed, inject, signal } from "@angular/core";
import { Dialog } from "@angular/cdk/dialog";
import { EMPTY, forkJoin } from "rxjs";
import { catchError, finalize, tap, take } from "rxjs/operators";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { AvailabilityService } from "../../../core/services/availability.service";
import {
  CreateAvailabilityCalendarEventPayload,
  CreateSlotPayload,
  Meeting,
} from "../../../core/models/api.model";
import { ToastService } from "../../../core/services/toast.service";
import { MeetingService } from "../../../core/services/meeting.service";
import { ModalService } from "../../../core/services/modal.service";
import { AvailabilityEventDialogComponent } from "../components/availability-event-dialog/availability-event-dialog.component";
import { AvailabilityDayDetailsComponent } from "../components/availability-day-details/availability-day-details.component";
import { AvailabilityMonthGridComponent } from "../components/availability-month-grid/availability-month-grid.component";
import {
  AvailabilityEventDialogData,
  AvailabilityEventDialogResult,
} from "../models/availability-event-dialog.model";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { TooltipDirective } from "../../../shared/components/tooltip/tooltip.directive";
import { MeetingDetailsDialogComponent } from "../components/meeting-details-dialog/meeting-details-dialog.component";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { I18nService } from "../../../core/i18n/i18n.service";
import {
  AvailabilityConflictKind,
  CALENDAR_FOCUS_DELAY_MS,
  DEFAULT_RECURRING_EVENT_YEARS,
  MixedConflictChoice,
  MonthCell,
  MonthCellItem,
  OverlappingCalendarEvent,
  SINGLE_EVENT_REPEAT_EVERY_DAYS,
  WEEKDAYS,
  WEEKLY_REPEAT_EVERY_DAYS,
} from "../models/availability-calendar.model";
import {
  addYears,
  buildMonthCells,
  formatDateKey,
  sortCalendarEvents,
  startOfMonth,
  weekOffset,
} from "../utils/availability-calendar.utils";
import {
  conflictKind,
  findOverlappingEvents,
  mergeAsDateOverride,
  mergeCalendarEvents,
  mergeRecurringRule,
  visibleCalendarEventsForDate,
} from "../utils/availability-conflicts.utils";

@Component({
  selector: "ccs-availability",
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    AvailabilityEventDialogComponent,
    AvailabilityDayDetailsComponent,
    AvailabilityMonthGridComponent,
    IconComponent,
    TooltipDirective,
    TranslatePipe,
  ],
  templateUrl: "./availability.page.html",
  styleUrl: "./availability.page.scss",
})
export class AvailabilityPage {
  readonly service = inject(AvailabilityService);
  readonly meetingService = inject(MeetingService);
  readonly toast = inject(ToastService);
  readonly modal = inject(ModalService);
  readonly i18n = inject(I18nService);
  private readonly dialog = inject(Dialog);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly weekdays = WEEKDAYS;
  readonly currentMonth = signal(startOfMonth(new Date()));
  readonly slots = signal<CreateSlotPayload[]>([]);
  readonly calendarEvents = signal<CreateAvailabilityCalendarEventPayload[]>(
    [],
  );
  readonly meetings = signal<Meeting[]>([]);
  readonly editorOpen = signal(false);
  readonly editorData = signal<AvailabilityEventDialogData | null>(null);
  readonly dayDetailsOpen = signal(false);
  readonly selectedDay = signal<MonthCell | null>(null);
  readonly focusedDateKey = signal(formatDateKey(new Date()));
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.localeName(), {
      month: "long",
      year: "numeric",
    }).format(this.currentMonth()),
  );
  readonly monthCells = computed(() =>
    buildMonthCells({
      month: this.currentMonth(),
      today: new Date(),
      slotsForDay: (dayIndex) => this.slotsForDay(dayIndex),
      visibleCalendarEventsForDate: (dateKey) =>
        this.visibleCalendarEventsForDate(dateKey),
      meetingsForDate: (dateKey) => this.meetingsForDate(dateKey),
      isPastMeeting: (meeting) => this.isPastMeeting(meeting),
      formatTime: (value) => this.formatTime(value),
      repeatLabel: (value) => this.repeatLabel(value),
      translate: (key) => this.i18n.translate(key),
      timeToMinutes: (value) => this.timeToMinutes(value),
    }),
  );
  readonly saving = signal(false);

  constructor() {
    this.service.slots$
      .pipe(
        take(1),
        tap((savedSlots) =>
          this.slots.set(
            savedSlots.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          ),
        ),
      )
      .subscribe();

    this.service.events$
      .pipe(
        take(1),
        tap((savedEvents) =>
          this.calendarEvents.set(
            savedEvents.map((event) => ({
              startDate: event.startDate,
              endDate: event.endDate,
              repeatEveryDays: event.repeatEveryDays,
              startTime: event.startTime,
              endTime: event.endTime,
            })),
          ),
        ),
      )
      .subscribe();

    this.meetingService.meetings$
      .pipe(
        tap((meetings) =>
          this.meetings.set(
            meetings.filter((meeting) => meeting.status === "scheduled"),
          ),
        ),
      )
      .subscribe();
  }

  openDateDialog(date: Date, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dayDetailsOpen.set(false);

    this.editorData.set({
      dateKey: formatDateKey(date),
      mode: "single",
    });
    this.editorOpen.set(true);
  }

  openDateDialogForEvent(item: MonthCellItem, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (item.kind !== "date" || item.eventIndex === undefined) return;

    const calendarEvent = this.calendarEvents()[item.eventIndex];
    if (!calendarEvent) return;

    this.editorData.set({
      dateKey: calendarEvent.startDate,
      mode:
        calendarEvent.startDate === calendarEvent.endDate &&
        calendarEvent.repeatEveryDays === 1
          ? "single"
          : "recurring",
      event: calendarEvent,
      eventIndex: item.eventIndex,
    });
    this.editorOpen.set(true);
    this.dayDetailsOpen.set(false);
  }

  openWeeklySlotDialog(item: MonthCellItem, date: Date, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (
      item.kind !== "weekly" ||
      item.dayIndex === undefined ||
      item.slotIndex === undefined
    ) {
      return;
    }

    const slot = this.slotsForDay(item.dayIndex)[item.slotIndex];
    if (!slot) return;

    const dateKey = formatDateKey(date);

    this.editorData.set({
      dateKey,
      mode: "recurring",
      event: {
        startDate: dateKey,
        endDate: formatDateKey(addYears(date, DEFAULT_RECURRING_EVENT_YEARS)),
        repeatEveryDays: WEEKLY_REPEAT_EVERY_DAYS,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      weeklySlot: {
        dayIndex: item.dayIndex,
        slotIndex: item.slotIndex,
      },
    });
    this.editorOpen.set(true);
    this.dayDetailsOpen.set(false);
  }

  openDayDetails(date: Date, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    const dateKey = formatDateKey(date);
    const cell = this.monthCells().find((item) => item.dateKey === dateKey);
    if (!cell) return;

    this.selectedDay.set(cell);
    this.dayDetailsOpen.set(true);
  }

  closeDayDetails() {
    this.dayDetailsOpen.set(false);
    this.selectedDay.set(null);
  }

  closeDateDialog() {
    this.editorOpen.set(false);
    this.editorData.set(null);
  }

  async saveDateDialog(event: AvailabilityEventDialogResult) {
    const editor = this.editorData();
    const previousSlots = this.slots();
    const previousEvents = this.calendarEvents();

    if (editor?.weeklySlot) {
      this.updateWeeklySlot(editor.weeklySlot, event);
      this.closeDateDialog();
      this.persistAvailability(previousSlots, previousEvents);
      return;
    }

    if (editor?.eventIndex !== undefined) {
      await this.updateCalendarEvent(editor.eventIndex, event);
      this.closeDateDialog();
      this.persistAvailability(previousSlots, previousEvents);
      return;
    }

    await this.addCalendarEvent(event);
    this.closeDateDialog();
    this.persistAvailability(previousSlots, previousEvents);
  }

  goToToday() {
    this.focusCalendarDate(new Date());
  }

  goToPreviousMonth() {
    const date = this.currentMonth();
    this.focusCalendarDate(
      new Date(date.getFullYear(), date.getMonth() - 1, 1),
    );
  }

  goToNextMonth() {
    const date = this.currentMonth();
    this.focusCalendarDate(
      new Date(date.getFullYear(), date.getMonth() + 1, 1),
    );
  }

  isFocusedDate(dateKey: string) {
    return this.focusedDateKey() === dateKey;
  }

  setFocusedDate(dateKey: string) {
    this.focusedDateKey.set(dateKey);
  }

  handleCalendarDayKeydown(event: KeyboardEvent, cell: MonthCell) {
    const targetDate = new Date(cell.date);

    switch (event.key) {
      case "ArrowLeft":
        targetDate.setDate(targetDate.getDate() - 1);
        break;
      case "ArrowRight":
        targetDate.setDate(targetDate.getDate() + 1);
        break;
      case "ArrowUp":
        targetDate.setDate(targetDate.getDate() - 7);
        break;
      case "ArrowDown":
        targetDate.setDate(targetDate.getDate() + 7);
        break;
      case "Home":
        targetDate.setDate(targetDate.getDate() - weekOffset(targetDate));
        break;
      case "End":
        targetDate.setDate(
          targetDate.getDate() + (6 - weekOffset(targetDate)),
        );
        break;
      case "PageUp":
        targetDate.setMonth(targetDate.getMonth() - 1);
        break;
      case "PageDown":
        targetDate.setMonth(targetDate.getMonth() + 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.focusCalendarDate(targetDate);
  }

  formatDate(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString(this.localeName(), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  formatCalendarEvent(event: CreateAvailabilityCalendarEventPayload) {
    const repeat =
      event.repeatEveryDays === SINGLE_EVENT_REPEAT_EVERY_DAYS
        ? this.i18n.translate("availability.every_day")
        : `${this.i18n.translate("availability.every")} ${event.repeatEveryDays} ${this.repeatLabel(
            event.repeatEveryDays,
          )}`;

    return `${this.formatDate(event.startDate)} — ${this.formatDate(
      event.endDate,
    )}, ${repeat}, ${event.startTime}—${event.endTime}`;
  }

  removeCalendarEvent(index: number) {
    this.calendarEvents.update((events) =>
      events.filter((_, currentIndex) => currentIndex !== index),
    );
    this.refreshSelectedDay();
  }

  async removeCalendarItem(item: MonthCellItem, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (item.kind === "meeting") {
      this.openMeetingDialog(item, event);
      return;
    }

    const confirmed = await this.modal.confirm({
      title: this.i18n.translate("availability.delete_slot_title"),
      message: this.i18n.translate("availability.delete_slot_message"),
      confirmText: this.i18n.translate("common.delete"),
      cancelText: this.i18n.translate("common.cancel"),
    });

    if (!confirmed) return;

    const previousSlots = this.slots();
    const previousEvents = this.calendarEvents();

    if (item.kind === "date" && item.eventIndex !== undefined) {
      this.removeCalendarEvent(item.eventIndex);
      this.persistAvailability(previousSlots, previousEvents);
      return;
    }

    if (
      item.kind === "weekly" &&
      item.dayIndex !== undefined &&
      item.slotIndex !== undefined
    ) {
      this.removeSlot(item.dayIndex, item.slotIndex);
      this.persistAvailability(previousSlots, previousEvents);
    }
  }

  openCalendarItem(item: MonthCellItem, date: Date, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (item.kind === "meeting") {
      this.openMeetingDialog(item, event);
      return;
    }

    if (item.kind === "date") {
      this.openDateDialogForEvent(item, event);
      return;
    }

    if (item.kind === "weekly") {
      this.openWeeklySlotDialog(item, date, event);
    }
  }

  openMeetingDialog(item: MonthCellItem, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!item.meeting) return;

    this.dialog.open<void, Meeting, MeetingDetailsDialogComponent>(
      MeetingDetailsDialogComponent,
      {
        data: item.meeting,
        hasBackdrop: true,
        ariaModal: true,
        autoFocus: "dialog",
        restoreFocus: true,
        width: "auto",
        maxWidth: "calc(100vw - 2rem)",
        backdropClass: "app-dialog-backdrop",
      },
    );
  }

  async addCalendarEvent(event: CreateAvailabilityCalendarEventPayload) {
    const overlappingEvents = this.findOverlappingEvents(event);

    if (overlappingEvents.length > 0) {
      const handled = await this.handleCalendarEventConflict(
        event,
        overlappingEvents,
      );
      return handled;
    }

    let changed = false;
    this.calendarEvents.update((current) => {
      const exists = current.some(
        (item) =>
          item.startDate === event.startDate &&
          item.endDate === event.endDate &&
          item.repeatEveryDays === event.repeatEveryDays &&
          item.startTime === event.startTime &&
          item.endTime === event.endTime,
      );

      if (exists) {
        return current;
      }

      changed = true;
      return this.sortCalendarEvents([...current, event]);
    });
    return changed;
  }

  private persistAvailability(
    previousSlots: CreateSlotPayload[],
    previousEvents: CreateAvailabilityCalendarEventPayload[],
  ) {
    if (
      this.sameSlots(previousSlots, this.slots()) &&
      this.sameEvents(previousEvents, this.calendarEvents())
    ) {
      return;
    }

    this.saving.set(true);
    forkJoin({
      slots: this.service.setSlots(this.slots()),
      events: this.service.setEvents(this.calendarEvents()),
    })
      .pipe(
        tap(() => {
          this.toast.success(
            this.i18n.translate("availability.toast.saved_title"),
            this.i18n.translate("availability.toast.saved_message"),
          );
        }),
        catchError(() => {
          this.slots.set(previousSlots);
          this.calendarEvents.set(previousEvents);
          this.refreshSelectedDay();
          this.toast.error(
            this.i18n.translate("availability.toast.save_error_title"),
            this.i18n.translate("availability.toast.save_error_message"),
          );
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe();
  }

  private repeatLabel(value: number) {
    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return this.i18n.translate("common.day.one");
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return this.i18n.translate("common.day.few");
    }
    return this.i18n.translate("common.day.many");
  }

  private focusCalendarDate(date: Date) {
    const dateKey = formatDateKey(date);
    this.currentMonth.set(startOfMonth(date));
    this.focusedDateKey.set(dateKey);
    window.setTimeout(() => {
      this.elementRef.nativeElement
        .querySelector<HTMLElement>(`[data-calendar-date="${dateKey}"]`)
        ?.focus();
    }, CALENDAR_FOCUS_DELAY_MS);
  }

  private meetingsForDate(dateKey: string) {
    return this.meetings()
      .filter(
        (meeting) =>
          formatDateKey(new Date(meeting.startTime)) === dateKey,
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  private isPastMeeting(meeting: Meeting) {
    return new Date(meeting.endTime).getTime() < Date.now();
  }

  private slotsForDay(dayIndex: number) {
    return this.slots()
      .filter((slot) => slot.dayOfWeek === dayIndex)
      .sort(
        (a, b) =>
          this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
      );
  }

  private removeSlot(dayIndex: number, slotIndex: number) {
    const currentSlots = this.slotsForDay(dayIndex);
    const target = currentSlots[slotIndex];

    if (!target) return;

    this.slots.update((current) =>
      current.filter(
        (slot) =>
          !(
            slot.dayOfWeek === dayIndex &&
            slot.startTime === target.startTime &&
            slot.endTime === target.endTime
          ),
      ),
    );
    this.refreshSelectedDay();
  }

  private updateWeeklySlot(
    weeklySlot: NonNullable<AvailabilityEventDialogData["weeklySlot"]>,
    event: AvailabilityEventDialogResult,
  ) {
    const { dayIndex, slotIndex } = weeklySlot;
    const currentSlots = this.slotsForDay(dayIndex);
    const target = currentSlots[slotIndex];

    if (!target) return;

    const nextDayIndex = new Date(`${event.startDate}T00:00:00`).getDay();
    const nextSlot: CreateSlotPayload = {
      dayOfWeek: nextDayIndex,
      startTime: event.startTime,
      endTime: event.endTime,
    };

    this.slots.update((current) =>
      [...current.filter((slot) => slot !== target), nextSlot].sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek ||
          this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
      ),
    );
    this.refreshSelectedDay();
  }

  private async updateCalendarEvent(
    eventIndex: number,
    event: CreateAvailabilityCalendarEventPayload,
  ) {
    const previous = this.calendarEvents()[eventIndex];
    if (!previous) return;

    this.calendarEvents.update((current) =>
      this.sortCalendarEvents(
        current.filter((_, index) => index !== eventIndex),
      ),
    );
    const updated = await this.addCalendarEvent(event);
    if (!updated) {
      this.calendarEvents.update((current) =>
        this.sortCalendarEvents([...current, previous]),
      );
    }
    this.refreshSelectedDay();
  }

  private formatTime(value: string) {
    return new Intl.DateTimeFormat(this.localeName(), {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  private localeName() {
    return this.i18n.locale() === "zh" ? "zh-CN" : this.i18n.locale();
  }

  private findOverlappingEvents(event: CreateAvailabilityCalendarEventPayload) {
    return findOverlappingEvents(
      this.calendarEvents(),
      event,
      (value) => this.timeToMinutes(value),
    );
  }

  private async handleCalendarEventConflict(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    const kind = this.conflictKind(event, overlappingEvents);

    if (kind === "mixed") {
      const choice = (await this.modal.choose({
        title: this.i18n.translate("availability.conflict.mixed_title"),
        message: this.i18n.translate("availability.conflict.mixed_message"),
        actions: [
          {
            value: "date",
            label: this.i18n.translate("availability.conflict.merge_date"),
            kind: "primary",
          },
          {
            value: "recurring",
            label: this.i18n.translate(
              "availability.conflict.update_recurring",
            ),
            kind: "secondary",
          },
          {
            value: "cancel",
            label: this.i18n.translate("availability.conflict.cancel_create"),
            kind: "secondary",
          },
        ],
      })) as MixedConflictChoice | null;

      if (!choice || choice === "cancel") return false;

      if (choice === "date") {
        this.mergeAsDateOverride(event, overlappingEvents);
        return true;
      }

      this.mergeRecurringRule(event, overlappingEvents);
      return true;
    }

    const shouldMerge = await this.modal.confirm({
      title: this.i18n.translate("availability.conflict.title"),
      message:
        kind === "single"
          ? this.i18n.translate("availability.conflict.single_message")
          : this.i18n.translate("availability.conflict.recurring_message"),
      confirmText: this.i18n.translate("availability.conflict.merge"),
      cancelText: this.i18n.translate("availability.conflict.cancel_create"),
    });

    if (!shouldMerge) return false;

    this.mergeCalendarEvents(event, overlappingEvents);
    return true;
  }

  private conflictKind(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ): AvailabilityConflictKind {
    return conflictKind(event, overlappingEvents);
  }

  private mergeCalendarEvents(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    this.calendarEvents.update((current) =>
      mergeCalendarEvents(
        current,
        event,
        overlappingEvents,
        (value) => this.timeToMinutes(value),
        (value) => this.minutesToTime(value),
        (items) => this.sortCalendarEvents(items),
      ),
    );
  }

  private mergeAsDateOverride(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    this.calendarEvents.update((current) =>
      mergeAsDateOverride(
        current,
        event,
        overlappingEvents,
        (value) => this.timeToMinutes(value),
        (value) => this.minutesToTime(value),
        (items) => this.sortCalendarEvents(items),
      ),
    );
  }

  private mergeRecurringRule(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    this.calendarEvents.update((current) =>
      mergeRecurringRule(
        current,
        event,
        overlappingEvents,
        (value) => this.timeToMinutes(value),
        (value) => this.minutesToTime(value),
        (items) => this.sortCalendarEvents(items),
      ),
    );
  }

  private visibleCalendarEventsForDate(dateKey: string) {
    return visibleCalendarEventsForDate(
      this.calendarEvents(),
      dateKey,
      (value) => this.timeToMinutes(value),
    );
  }

  private sortCalendarEvents(events: CreateAvailabilityCalendarEventPayload[]) {
    return sortCalendarEvents(events, (value) => this.timeToMinutes(value));
  }

  private timeToMinutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  private sameSlots(first: CreateSlotPayload[], second: CreateSlotPayload[]) {
    return JSON.stringify(first) === JSON.stringify(second);
  }

  private sameEvents(
    first: CreateAvailabilityCalendarEventPayload[],
    second: CreateAvailabilityCalendarEventPayload[],
  ) {
    return JSON.stringify(first) === JSON.stringify(second);
  }

  private refreshSelectedDay() {
    const selected = this.selectedDay();
    if (!selected) return;

    const updated = this.monthCells().find(
      (cell) => cell.dateKey === selected.dateKey,
    );
    this.selectedDay.set(updated ?? null);
  }
}
