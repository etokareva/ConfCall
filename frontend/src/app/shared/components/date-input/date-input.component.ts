import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  forwardRef,
  inject,
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import type { Instance } from "flatpickr/dist/types/instance";
import type { DateOption } from "flatpickr/dist/types/options";
import { IconComponent } from "../icon/icon.component";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { I18nService } from "../../../core/i18n/i18n.service";
import {
  decorateFlatpickrCalendar,
  FLATPICKR_NEXT_ARROW,
  FLATPICKR_PREV_ARROW,
  getFlatpickrLocale,
  isFlatpickrInstance,
  prepareFlatpickrControls,
} from "../../utils/flatpickr-controls";

type FlatpickrDayElement = HTMLElement & { dateObj?: Date };

@Component({
  selector: "ccs-date-input",
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: "./date-input.component.html",
  styleUrl: "./date-input.component.scss",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent
  implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() label = "";
  @Input() inputId = "";
  @Input() name = "";
  @Input() openLabel = "book.open_calendar";
  @Input() minDate: string | Date | null = null;
  @Input() describedBy = "";
  @Input() closeOnSelect = true;
  @Input() availableDates: readonly string[] = [];
  @ViewChild("input") input?: ElementRef<HTMLInputElement>;
  @ViewChild("positionAnchor") positionAnchor?: ElementRef<HTMLElement>;

  value = "";
  disabled = false;
  readonly isOpen = signal(false);

  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private picker?: Instance;
  private keyboardFocusDate?: Date;
  private focusCalendarOnOpen = false;
  private readonly calendarKeydownHandler = (event: KeyboardEvent) =>
    this.onCalendarKeydown(event);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit() {
    if (!this.input?.nativeElement) return;

    const anchorElement =
      this.positionAnchor?.nativeElement ?? this.input.nativeElement;

    this.picker = flatpickr(this.input.nativeElement, {
      allowInput: true,
      ariaDateFormat: "d F Y",
      dateFormat: "d.m.Y",
      defaultDate: this.getDefaultDate(),
      disableMobile: true,
      disable: [(date: Date) => this.isBeforeMinDate(date)],
      closeOnSelect: this.closeOnSelect,
      minDate: this.minDate || undefined,
      locale: getFlatpickrLocale(this.i18n.locale()),
      mode: "single",
      nextArrow: FLATPICKR_NEXT_ARROW,
      prevArrow: FLATPICKR_PREV_ARROW,
      position: "auto left",
      positionElement: anchorElement,
      onChange: (dates, dateText) =>
        this.updateValue(dateText, dates[0] ?? null),
      onValueUpdate: (dates, dateText) =>
        this.updateValue(dateText, dates[0] ?? null),
      onClose: () => {
        this.isOpen.set(false);
        this.keyboardFocusDate = undefined;
        this.onTouched();
      },
      onOpen: () => {
        this.isOpen.set(true);
        if (this.focusCalendarOnOpen) {
          this.focusCalendarOnOpen = false;
          window.setTimeout(() => this.focusInitialDay(), 0);
        } else {
          this.syncAccessibleDays();
        }
      },
      onReady: (_dates, _dateText, instance) => {
        prepareFlatpickrControls(instance, {
          idPrefix: this.inputId || "ccs-date",
          monthLabel: this.i18n.translate("common.month"),
          yearLabel: this.i18n.translate("common.year"),
        });
        decorateFlatpickrCalendar(instance);
        instance.calendarContainer.addEventListener(
          "keydown",
          this.calendarKeydownHandler,
        );
        this.syncAccessibleDays();
      },
      onDayCreate: (_dates, _dateText, _instance, dayElement) => {
        this.applyAvailabilityHighlight(dayElement);
      },
      onMonthChange: (_dates, _dateText, instance) => {
        decorateFlatpickrCalendar(instance);
        this.syncAccessibleDays();
      },
      onYearChange: (_dates, _dateText, instance) => {
        decorateFlatpickrCalendar(instance);
        this.syncAccessibleDays();
      },
    });

    this.syncDisplayedValue();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!isFlatpickrInstance(this.picker)) {
      return;
    }

    if (changes["minDate"]) {
      this.picker.set("minDate", this.minDate || undefined);
      this.picker.set("disable", [(date: Date) => this.isBeforeMinDate(date)]);
    }

    if (changes["closeOnSelect"]) {
      this.picker.set("closeOnSelect", this.closeOnSelect);
    }

    if (changes["availableDates"]) {
      this.picker.redraw();
      this.syncAccessibleDays();
    }
  }

  ngOnDestroy() {
    if (isFlatpickrInstance(this.picker)) {
      this.picker.calendarContainer.removeEventListener(
        "keydown",
        this.calendarKeydownHandler,
      );
      this.picker.destroy();
    }
  }

  writeValue(value: string | null): void {
    this.value = value ?? "";
    this.syncDisplayedValue();
    if (isFlatpickrInstance(this.picker)) {
      const defaultDate = this.getDefaultDate();
      if (defaultDate) {
        this.picker.setDate(defaultDate, false);
      } else {
        this.picker.clear(false);
      }
    }
    this.cdr.detectChanges();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.input?.nativeElement) {
      this.input.nativeElement.disabled = isDisabled;
    }
  }

  onInput(event: Event) {
    this.updateValue((event.target as HTMLInputElement).value);
  }

  onInputKeydown(event: KeyboardEvent) {
    if (event.key !== "ArrowDown") {
      return;
    }

    event.preventDefault();
    this.focusCalendarOnOpen = true;
    this.openPickerFromInput();
    window.setTimeout(() => this.focusInitialDay(), 0);
  }

  openPicker(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (isFlatpickrInstance(this.picker)) {
      this.focusCalendarOnOpen = true;
      this.picker.open();
    }
  }

  openPickerFromInput() {
    if (this.disabled) {
      return;
    }

    if (isFlatpickrInstance(this.picker)) {
      this.focusCalendarOnOpen = false;
      this.picker.open();
    }
  }

  markTouched() {
    this.onTouched();
  }

  private updateValue(value: string, selectedDate: Date | null = null) {
    const isoValue = selectedDate
      ? this.formatIsoDate(selectedDate)
      : this.parseDisplayDate(value);

    this.value = isoValue;
    this.syncDisplayedValue();
    this.onChange(isoValue);
    this.cdr.detectChanges();
  }

  private onCalendarKeydown(event: KeyboardEvent) {
    if (!isFlatpickrInstance(this.picker)) {
      return;
    }

    const dayOffsets: Partial<Record<string, number>> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      PageUp: -30,
      PageDown: 30,
    };

    if (event.key in dayOffsets) {
      event.preventDefault();
      this.focusDateByOffset(dayOffsets[event.key] ?? 0);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      this.focusWeekEdge(event.key === "Home" ? "start" : "end");
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.selectFocusedDate();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.picker.close();
      this.input?.nativeElement.focus();
    }
  }

  private focusInitialDay() {
    if (!isFlatpickrInstance(this.picker)) {
      return;
    }

    const initialDate =
      this.picker.selectedDates[0] ??
      this.keyboardFocusDate ??
      this.getTodayOrMinDate();
    this.focusDate(initialDate);
  }

  private focusDateByOffset(offset: number) {
    const currentDate = this.getFocusedDate();
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + offset);
    this.focusDate(this.clampToMinDate(nextDate));
  }

  private focusWeekEdge(edge: "start" | "end") {
    const currentDate = this.getFocusedDate();
    const nextDate = new Date(currentDate);
    const day = nextDate.getDay();
    const offset = edge === "start" ? -day : 6 - day;
    nextDate.setDate(nextDate.getDate() + offset);
    this.focusDate(this.clampToMinDate(nextDate));
  }

  private selectFocusedDate() {
    if (!isFlatpickrInstance(this.picker)) {
      return;
    }

    const selectedDate = this.clampToMinDate(this.getFocusedDate());
    this.keyboardFocusDate = selectedDate;
    this.picker.setDate(selectedDate, true);

    if (this.closeOnSelect) {
      this.picker.close();
      this.input?.nativeElement.focus();
    } else {
      this.focusDate(selectedDate);
    }
  }

  private focusDate(date: Date) {
    if (!isFlatpickrInstance(this.picker)) {
      return;
    }

    const nextDate = this.clampToMinDate(date);
    this.keyboardFocusDate = nextDate;
    this.picker.jumpToDate(nextDate);
    window.setTimeout(() => {
      this.syncAccessibleDays(nextDate);
      this.findDayElement(nextDate)?.focus();
    }, 0);
  }

  private syncAccessibleDays(activeDate = this.keyboardFocusDate) {
    if (!isFlatpickrInstance(this.picker)) {
      return;
    }

    const days = this.getEnabledDayElements();
    const selectedDate = this.picker.selectedDates[0];
    const fallbackDate = selectedDate ?? activeDate ?? this.getTodayOrMinDate();
    const activeIso = this.formatIsoDate(this.clampToMinDate(fallbackDate));

    days.forEach((day) => {
      const date = day.dateObj;
      const isActive = date
        ? this.formatIsoDate(date) === activeIso
        : day === days[0];
      const isSelected =
        Boolean(date && selectedDate) &&
        this.formatIsoDate(date as Date) === this.formatIsoDate(selectedDate);

      day.setAttribute("role", "button");
      day.setAttribute("tabindex", isActive ? "0" : "-1");
      day.setAttribute("aria-pressed", String(isSelected));
    });
  }

  private getEnabledDayElements() {
    if (!isFlatpickrInstance(this.picker)) {
      return [];
    }

    return Array.from(
      this.picker.calendarContainer.querySelectorAll<FlatpickrDayElement>(
        ".flatpickr-day",
      ),
    ).filter(
      (day) =>
        !day.classList.contains("flatpickr-disabled") &&
        day.getAttribute("aria-disabled") !== "true" &&
        Boolean(day.dateObj),
    );
  }

  private findDayElement(date: Date) {
    const isoDate = this.formatIsoDate(date);
    return (
      this.getEnabledDayElements().find((day) => {
        const dayDate = day.dateObj;
        return Boolean(dayDate && this.formatIsoDate(dayDate) === isoDate);
      }) ?? null
    );
  }

  private getFocusedDate() {
    const activeElement = document.activeElement as FlatpickrDayElement | null;
    if (activeElement?.dateObj) {
      return activeElement.dateObj;
    }

    return (
      this.keyboardFocusDate ??
      this.picker?.selectedDates[0] ??
      this.getTodayOrMinDate()
    );
  }

  private getTodayOrMinDate() {
    return this.clampToMinDate(new Date());
  }

  private clampToMinDate(date: Date) {
    if (!this.minDate) {
      return date;
    }

    const minDate =
      this.minDate instanceof Date ? this.minDate : new Date(this.minDate);
    if (Number.isNaN(minDate.getTime())) {
      return date;
    }

    const normalizedDate = new Date(date);
    const normalizedMinDate = new Date(minDate);
    normalizedDate.setHours(0, 0, 0, 0);
    normalizedMinDate.setHours(0, 0, 0, 0);

    return normalizedDate < normalizedMinDate ? normalizedMinDate : date;
  }

  private parseDisplayDate(value: string) {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
    if (!match) return value.trim();

    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  private parseSingleValue(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const displayMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
    if (displayMatch) {
      return this.parseDisplayDate(trimmed);
    }

    return "";
  }

  private formatIsoDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  private applyAvailabilityHighlight(dayElement: HTMLElement) {
    const date = (dayElement as HTMLElement & { dateObj?: Date }).dateObj;
    if (!date) {
      return;
    }

    const isoDate = this.formatIsoDate(date);
    const isAvailable =
      this.availableDates.includes(isoDate) && !this.isBeforeMinDate(date);
    dayElement.classList.toggle("ccs-flatpickr-day--available", isAvailable);
  }

  private formatDisplayDate(iso: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return iso;

    const [, year, month, day] = match;
    return `${day}.${month}.${year}`;
  }

  private getDefaultDate(): DateOption | undefined {
    return this.parseSingleValue(this.value) || undefined;
  }

  private isBeforeMinDate(date: Date) {
    if (!this.minDate) return false;

    const minDate =
      this.minDate instanceof Date ? this.minDate : new Date(this.minDate);
    if (Number.isNaN(minDate.getTime())) return false;

    const candidate = new Date(date);
    const normalizedMinDate = new Date(minDate);
    candidate.setHours(0, 0, 0, 0);
    normalizedMinDate.setHours(0, 0, 0, 0);

    return candidate < normalizedMinDate;
  }

  private syncDisplayedValue() {
    const input = this.input?.nativeElement;
    const normalized = this.parseSingleValue(this.value);
    const displayValue = normalized
      ? this.formatDisplayDate(normalized)
      : this.value;

    if (input) {
      input.value = displayValue;
    }
  }
}
