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
import {
  AvailabilityEventDialogData,
  AvailabilityEventDialogResult,
} from "../models/availability-event-dialog.model";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { TooltipDirective } from "../../../shared/components/tooltip/tooltip.directive";
import { MeetingDetailsDialogComponent } from "../components/meeting-details-dialog/meeting-details-dialog.component";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { I18nService } from "../../../core/i18n/i18n.service";
import { ModalShellComponent } from "../../../shared/components/modal-shell/modal-shell.component";

interface WeekdayOption {
  index: number;
  shortLabelKey: string;
  longLabelKey: string;
}

interface MonthCellItem {
  tooltip: string;
  kind: "weekly" | "date" | "meeting";
  timeRange: string;
  isPast?: boolean;
  title?: string;
  eventIndex?: number;
  dayIndex?: number;
  slotIndex?: number;
  meeting?: Meeting;
}

interface MonthCell {
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

interface OverlappingCalendarEvent {
  event: CreateAvailabilityCalendarEventPayload;
  index: number;
}

type AvailabilityConflictKind = "single" | "recurring" | "mixed";
type MixedConflictChoice = "date" | "recurring" | "cancel";

const WEEKDAYS: WeekdayOption[] = [
  { index: 1, shortLabelKey: "weekday.mon.short", longLabelKey: "weekday.mon" },
  { index: 2, shortLabelKey: "weekday.tue.short", longLabelKey: "weekday.tue" },
  { index: 3, shortLabelKey: "weekday.wed.short", longLabelKey: "weekday.wed" },
  { index: 4, shortLabelKey: "weekday.thu.short", longLabelKey: "weekday.thu" },
  { index: 5, shortLabelKey: "weekday.fri.short", longLabelKey: "weekday.fri" },
  { index: 6, shortLabelKey: "weekday.sat.short", longLabelKey: "weekday.sat" },
  { index: 0, shortLabelKey: "weekday.sun.short", longLabelKey: "weekday.sun" },
];

@Component({
  selector: "ccs-availability",
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    AvailabilityEventDialogComponent,
    IconComponent,
    TooltipDirective,
    TranslatePipe,
    ModalShellComponent,
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
  readonly currentMonth = signal(this.startOfMonth(new Date()));
  readonly slots = signal<CreateSlotPayload[]>([]);
  readonly calendarEvents = signal<CreateAvailabilityCalendarEventPayload[]>(
    [],
  );
  readonly meetings = signal<Meeting[]>([]);
  readonly editorOpen = signal(false);
  readonly editorData = signal<AvailabilityEventDialogData | null>(null);
  readonly dayDetailsOpen = signal(false);
  readonly selectedDay = signal<MonthCell | null>(null);
  readonly focusedDateKey = signal(this.formatDateKey(new Date()));
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.localeName(), {
      month: "long",
      year: "numeric",
    }).format(this.currentMonth()),
  );
  readonly monthCells = computed(() =>
    this.buildMonthCells(this.currentMonth()),
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
      dateKey: this.formatDateKey(date),
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

    const dateKey = this.formatDateKey(date);

    this.editorData.set({
      dateKey,
      mode: "recurring",
      event: {
        startDate: dateKey,
        endDate: this.formatDateKey(this.addYears(date, 1)),
        repeatEveryDays: 7,
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

    const dateKey = this.formatDateKey(date);
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
        targetDate.setDate(targetDate.getDate() - this.weekOffset(targetDate));
        break;
      case "End":
        targetDate.setDate(
          targetDate.getDate() + (6 - this.weekOffset(targetDate)),
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

  formatShortDate(date: Date) {
    return new Intl.DateTimeFormat(this.localeName(), {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  formatCalendarEvent(event: CreateAvailabilityCalendarEventPayload) {
    const repeat =
      event.repeatEveryDays === 1
        ? this.i18n.translate("availability.every_day")
        : `${this.i18n.translate("availability.every")} ${event.repeatEveryDays} ${this.repeatLabel(
            event.repeatEveryDays,
          )}`;

    return `${this.formatDate(event.startDate)} — ${this.formatDate(
      event.endDate,
    )}, ${repeat}, ${event.startTime}—${event.endTime}`;
  }

  countLabel(value: number) {
    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return this.i18n.translate("common.item.one");
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return this.i18n.translate("common.item.few");
    }
    return this.i18n.translate("common.item.many");
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

    const confirmed = await this.modal.confirm(
      this.i18n.translate("availability.delete_slot_title"),
      this.i18n.translate("availability.delete_slot_message"),
      this.i18n.translate("common.delete"),
      this.i18n.translate("common.cancel"),
    );

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
    const dateKey = this.formatDateKey(date);
    this.currentMonth.set(this.startOfMonth(date));
    this.focusedDateKey.set(dateKey);
    window.setTimeout(() => {
      this.elementRef.nativeElement
        .querySelector<HTMLElement>(`[data-calendar-date="${dateKey}"]`)
        ?.focus();
    });
  }

  private weekOffset(date: Date) {
    return (date.getDay() + 6) % 7;
  }

  private buildMonthCells(month: Date): MonthCell[] {
    const start = this.getMonthGridStart(month);
    const end = this.getMonthGridEnd(month);
    const todayKey = this.formatDateKey(new Date());
    const cells: MonthCell[] = [];
    const date = new Date(start);

    while (date <= end) {
      const dateKey = this.formatDateKey(date);
      const items = this.monthItemsForDate(date);
      cells.push({
        date: new Date(date),
        dateKey,
        dayNumber: date.getDate(),
        inMonth: date.getMonth() === month.getMonth(),
        isToday: dateKey === todayKey,
        hasMeeting: items.some((item) => item.kind === "meeting"),
        items,
        visibleItems: items.slice(0, 3),
        hiddenItemsCount: Math.max(items.length - 3, 0),
      });
      date.setDate(date.getDate() + 1);
    }

    return cells;
  }

  private monthItemsForDate(date: Date): MonthCellItem[] {
    const dateKey = this.formatDateKey(date);
    const weeklyItems = this.slotsForDay(date.getDay()).map(
      (slot, slotIndex) => ({
        tooltip: this.i18n.translate("availability.weekly_slot_tooltip"),
        kind: "weekly" as const,
        timeRange: `${slot.startTime}—${slot.endTime}`,
        dayIndex: date.getDay(),
        slotIndex,
      }),
    );

    const appliedEvents = this.visibleCalendarEventsForDate(dateKey);
    const dateItems = appliedEvents.map(({ event, index }) => ({
      tooltip:
        event.repeatEveryDays === 1
          ? this.i18n.translate("availability.date_slot_tooltip")
          : `${this.i18n.translate("availability.every")} ${event.repeatEveryDays} ${this.repeatLabel(
              event.repeatEveryDays,
            )}`,
      kind: "date" as const,
      timeRange: `${event.startTime}—${event.endTime}`,
      eventIndex: index,
    }));

    const meetingItems = this.meetingsForDate(dateKey).map((meeting) => ({
      tooltip: `${this.i18n.translate("availability.meeting_tooltip_prefix")}: ${meeting.title}`,
      kind: "meeting" as const,
      isPast: this.isPastMeeting(meeting),
      title: meeting.title,
      timeRange: `${this.formatTime(meeting.startTime)}—${this.formatTime(
        meeting.endTime,
      )}`,
      meeting,
    }));

    return [...meetingItems, ...weeklyItems, ...dateItems].sort(
      (a, b) =>
        this.timeToMinutes(a.timeRange.slice(0, 5)) -
          this.timeToMinutes(b.timeRange.slice(0, 5)) ||
        this.itemKindOrder(a.kind) - this.itemKindOrder(b.kind),
    );
  }

  private meetingsForDate(dateKey: string) {
    return this.meetings()
      .filter(
        (meeting) =>
          this.formatDateKey(new Date(meeting.startTime)) === dateKey,
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

  private calendarEventApplies(
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

  private getMonthGridStart(month: Date) {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayFirstOffset = this.toMondayFirstWeekday(firstDay.getDay());
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayFirstOffset);
    return gridStart;
  }

  private getMonthGridEnd(month: Date) {
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const mondayFirstOffset = this.toMondayFirstWeekday(lastDay.getDay());
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(lastDay.getDate() + (6 - mondayFirstOffset));
    return gridEnd;
  }

  private toMondayFirstWeekday(nativeDayIndex: number) {
    return (nativeDayIndex + 6) % 7;
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private formatDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  private addYears(date: Date, years: number) {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + years);
    return next;
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
    return this.calendarEvents()
      .map((existing, index) => ({ event: existing, index }))
      .filter(({ event: existing }) => this.eventsOverlap(existing, event));
  }

  private async handleCalendarEventConflict(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    const kind = this.conflictKind(event, overlappingEvents);

    if (kind === "mixed") {
      const choice = (await this.modal.choose(
        this.i18n.translate("availability.conflict.mixed_title"),
        this.i18n.translate("availability.conflict.mixed_message"),
        [
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
      )) as MixedConflictChoice | null;

      if (!choice || choice === "cancel") return false;

      if (choice === "date") {
        this.mergeAsDateOverride(event, overlappingEvents);
        return true;
      }

      this.mergeRecurringRule(event, overlappingEvents);
      return true;
    }

    const shouldMerge = await this.modal.confirm(
      this.i18n.translate("availability.conflict.title"),
      kind === "single"
        ? this.i18n.translate("availability.conflict.single_message")
        : this.i18n.translate("availability.conflict.recurring_message"),
      this.i18n.translate("availability.conflict.merge"),
      this.i18n.translate("availability.conflict.cancel_create"),
    );

    if (!shouldMerge) return false;

    this.mergeCalendarEvents(event, overlappingEvents);
    return true;
  }

  private conflictKind(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ): AvailabilityConflictKind {
    const hasSingle = [
      event,
      ...overlappingEvents.map((item) => item.event),
    ].some((item) => this.isSingleEvent(item));
    const hasRecurring = [
      event,
      ...overlappingEvents.map((item) => item.event),
    ].some((item) => !this.isSingleEvent(item));

    if (hasSingle && hasRecurring) return "mixed";
    return hasSingle ? "single" : "recurring";
  }

  private eventsOverlap(
    first: CreateAvailabilityCalendarEventPayload,
    second: CreateAvailabilityCalendarEventPayload,
  ) {
    if (!this.timeRangesOverlap(first, second)) return false;

    const startKey =
      first.startDate > second.startDate ? first.startDate : second.startDate;
    const endKey =
      first.endDate < second.endDate ? first.endDate : second.endDate;
    if (startKey > endKey) return false;

    const date = new Date(`${startKey}T00:00:00`);
    const end = new Date(`${endKey}T00:00:00`);

    while (date <= end) {
      const dateKey = this.formatDateKey(date);
      if (
        this.calendarEventApplies(first, dateKey) &&
        this.calendarEventApplies(second, dateKey)
      ) {
        return true;
      }
      date.setDate(date.getDate() + 1);
    }

    return false;
  }

  private timeRangesOverlap(
    first: CreateAvailabilityCalendarEventPayload,
    second: CreateAvailabilityCalendarEventPayload,
  ) {
    return (
      this.timeToMinutes(first.startTime) <
        this.timeToMinutes(second.endTime) &&
      this.timeToMinutes(second.startTime) < this.timeToMinutes(first.endTime)
    );
  }

  private mergeCalendarEvents(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    const eventsToMerge = [
      event,
      ...overlappingEvents.map((item) => item.event),
    ];
    const baseEvent = overlappingEvents[0].event;
    const mergedEvent: CreateAvailabilityCalendarEventPayload = {
      startDate: eventsToMerge.reduce(
        (earliest, item) =>
          item.startDate < earliest ? item.startDate : earliest,
        event.startDate,
      ),
      endDate: eventsToMerge.reduce(
        (latest, item) => (item.endDate > latest ? item.endDate : latest),
        event.endDate,
      ),
      repeatEveryDays: baseEvent.repeatEveryDays,
      startTime: this.minutesToTime(
        Math.min(
          ...eventsToMerge.map((item) => this.timeToMinutes(item.startTime)),
        ),
      ),
      endTime: this.minutesToTime(
        Math.max(
          ...eventsToMerge.map((item) => this.timeToMinutes(item.endTime)),
        ),
      ),
    };
    const indexesToRemove = new Set(
      overlappingEvents.map((item) => item.index),
    );

    this.calendarEvents.update((current) =>
      this.sortCalendarEvents([
        ...current.filter((_, index) => !indexesToRemove.has(index)),
        mergedEvent,
      ]),
    );
  }

  private mergeAsDateOverride(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    const overrideDate = this.resolveDateOverrideKey(event, overlappingEvents);
    const eventsToMerge = [
      event,
      ...overlappingEvents
        .map((item) => item.event)
        .filter((item) => this.calendarEventApplies(item, overrideDate)),
    ];
    const mergedEvent: CreateAvailabilityCalendarEventPayload = {
      startDate: overrideDate,
      endDate: overrideDate,
      repeatEveryDays: 1,
      startTime: this.minutesToTime(
        Math.min(
          ...eventsToMerge.map((item) => this.timeToMinutes(item.startTime)),
        ),
      ),
      endTime: this.minutesToTime(
        Math.max(
          ...eventsToMerge.map((item) => this.timeToMinutes(item.endTime)),
        ),
      ),
    };
    const indexesToRemove = new Set(
      overlappingEvents
        .filter((item) => this.isSingleEvent(item.event))
        .map((item) => item.index),
    );

    this.calendarEvents.update((current) =>
      this.sortCalendarEvents([
        ...current.filter((_, index) => !indexesToRemove.has(index)),
        mergedEvent,
      ]),
    );
  }

  private mergeRecurringRule(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    const recurringOverlaps = overlappingEvents.filter(
      (item) => !this.isSingleEvent(item.event),
    );
    const baseEvent = !this.isSingleEvent(event)
      ? event
      : recurringOverlaps[0].event;
    const eventsToMerge = [
      event,
      ...overlappingEvents.map((item) => item.event),
    ];
    const indexesToRemove = new Set(
      overlappingEvents.map((item) => item.index),
    );
    const mergedEvent: CreateAvailabilityCalendarEventPayload = {
      startDate: baseEvent.startDate,
      endDate: baseEvent.endDate,
      repeatEveryDays: baseEvent.repeatEveryDays,
      startTime: this.minutesToTime(
        Math.min(
          ...eventsToMerge.map((item) => this.timeToMinutes(item.startTime)),
        ),
      ),
      endTime: this.minutesToTime(
        Math.max(
          ...eventsToMerge.map((item) => this.timeToMinutes(item.endTime)),
        ),
      ),
    };

    this.calendarEvents.update((current) =>
      this.sortCalendarEvents([
        ...current.filter((_, index) => !indexesToRemove.has(index)),
        mergedEvent,
      ]),
    );
  }

  private visibleCalendarEventsForDate(dateKey: string) {
    const appliedEvents = this.calendarEvents()
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => this.calendarEventApplies(event, dateKey));
    const singleEvents = appliedEvents.filter(({ event }) =>
      this.isSingleEvent(event),
    );

    return appliedEvents
      .filter(
        ({ event }) =>
          this.isSingleEvent(event) ||
          !singleEvents.some(({ event: singleEvent }) =>
            this.timeRangesOverlap(singleEvent, event),
          ),
      )
      .map(({ event, index }) => ({ event, index }));
  }

  private resolveDateOverrideKey(
    event: CreateAvailabilityCalendarEventPayload,
    overlappingEvents: OverlappingCalendarEvent[],
  ) {
    if (this.isSingleEvent(event)) return event.startDate;

    const singleOverlap = overlappingEvents.find((item) =>
      this.isSingleEvent(item.event),
    );
    if (singleOverlap) return singleOverlap.event.startDate;

    return event.startDate;
  }

  private isSingleEvent(event: CreateAvailabilityCalendarEventPayload) {
    return event.startDate === event.endDate && event.repeatEveryDays === 1;
  }

  private sortCalendarEvents(events: CreateAvailabilityCalendarEventPayload[]) {
    return [...events].sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime) ||
        this.timeToMinutes(a.endTime) - this.timeToMinutes(b.endTime),
    );
  }

  private itemKindOrder(kind: MonthCellItem["kind"]) {
    const order: Record<MonthCellItem["kind"], number> = {
      date: 0,
      weekly: 1,
      meeting: 2,
    };
    return order[kind];
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
