import {
  AfterViewInit,
  Component,
  ChangeDetectorRef,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  forwardRef,
  inject,
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

  value = "";
  disabled = false;

  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private picker?: Instance;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit() {
    if (!this.input?.nativeElement) return;

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
      positionElement: this.input.nativeElement,
      onChange: (dates, dateText) =>
        this.updateValue(dateText, dates[0] ?? null),
      onValueUpdate: (dates, dateText) =>
        this.updateValue(dateText, dates[0] ?? null),
      onClose: () => {
        this.onTouched();
      },
      onReady: (_dates, _dateText, instance) => {
        prepareFlatpickrControls(instance, {
          idPrefix: this.inputId || "ccs-date",
          monthLabel: this.i18n.translate("common.month"),
          yearLabel: this.i18n.translate("common.year"),
        });
        decorateFlatpickrCalendar(instance);
      },
      onDayCreate: (_dates, _dateText, _instance, dayElement) => {
        this.applyAvailabilityHighlight(dayElement);
      },
      onMonthChange: (_dates, _dateText, instance) => {
        decorateFlatpickrCalendar(instance);
      },
      onYearChange: (_dates, _dateText, instance) => {
        decorateFlatpickrCalendar(instance);
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
    }
  }

  ngOnDestroy() {
    if (isFlatpickrInstance(this.picker)) {
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

  openPicker(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (isFlatpickrInstance(this.picker)) {
      this.picker.open();
    }
  }

  openPickerFromInput() {
    if (this.disabled) {
      return;
    }

    if (isFlatpickrInstance(this.picker)) {
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
