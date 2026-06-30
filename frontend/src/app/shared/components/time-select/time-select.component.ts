import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  forwardRef,
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ConnectedPosition, OverlayModule } from "@angular/cdk/overlay";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { IconComponent } from "../icon/icon.component";

interface TimeOption {
  value: string;
  label: string;
}

const OVERLAY_GAP_PX = 8;
const TIME_OPTION_STEP_MINUTES = 30;

@Component({
  selector: "ccs-time-select",
  standalone: true,
  imports: [OverlayModule, TranslatePipe, IconComponent],
  templateUrl: "./time-select.component.html",
  styleUrl: "./time-select.component.scss",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeSelectComponent),
      multi: true,
    },
  ],
})
export class TimeSelectComponent implements ControlValueAccessor {
  @Input() label = "";
  @Input() inputId = "";
  @Input() name = "";
  @ViewChild("timeInput") timeInput?: ElementRef<HTMLInputElement>;

  readonly open = signal(false);
  readonly menuWidth = signal(0);
  readonly options = this.buildOptions();
  value = "";
  disabled = false;
  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: "start",
      originY: "bottom",
      overlayX: "start",
      overlayY: "top",
      offsetY: OVERLAY_GAP_PX,
    },
    {
      originX: "start",
      originY: "top",
      overlayX: "start",
      overlayY: "bottom",
      offsetY: -OVERLAY_GAP_PX,
    },
  ];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value ?? "";
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle() {
    if (this.disabled) return;
    if (this.open()) {
      this.close();
      return;
    }

    this.menuWidth.set(
      this.timeInput?.nativeElement.getBoundingClientRect().width ?? 0,
    );
    this.open.set(true);
  }

  close() {
    this.open.set(false);
    this.onTouched();
  }

  select(value: string) {
    this.value = value;
    this.onChange(value);
    this.close();
  }

  onInput(event: Event) {
    const rawValue = (event.target as HTMLInputElement).value;
    const maskedValue = this.maskTime(rawValue);
    this.value = maskedValue;
    this.onChange(maskedValue);
  }

  markTouched() {
    this.value = this.normalizeTime(this.value);
    this.onChange(this.value);
    this.onTouched();
  }

  private buildOptions(): TimeOption[] {
    const result: TimeOption[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += TIME_OPTION_STEP_MINUTES) {
        const value = `${String(hour).padStart(2, "0")}:${String(
          minute,
        ).padStart(2, "0")}`;
        result.push({ value, label: value });
      }
    }
    return result;
  }

  private maskTime(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  private normalizeTime(value: string) {
    const match = /^(\d{1,2})(?::?(\d{1,2}))?$/.exec(value.trim());
    if (!match) return value;

    const hours = Math.min(Number(match[1]), 23);
    const minutes = Math.min(Number(match[2] ?? 0), 59);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}`;
  }
}
