import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import {
  AvailabilityEventDialogData,
  AvailabilityEventDialogMode,
  AvailabilityEventDialogResult,
} from "../../models/availability-event-dialog.model";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { ModalShellComponent } from "../../../../shared/components/modal-shell/modal-shell.component";
import { DateInputComponent } from "../../../../shared/components/date-input/date-input.component";
import { TimeSelectComponent } from "../../../../shared/components/time-select/time-select.component";
import { TooltipDirective } from "../../../../shared/components/tooltip/tooltip.directive";
import { I18nService } from "../../../../core/i18n/i18n.service";

interface AvailabilityEventDialogFormValue {
  mode: AvailabilityEventDialogMode;
  singleDate: string;
  startDate: string;
  endDate: string;
  repeatEveryDays: number;
  startTime: string;
  endTime: string;
}

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";
const DEFAULT_REPEAT_DAYS = 7;

@Component({
  selector: "ccs-availability-event-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    ModalShellComponent,
    DateInputComponent,
    TimeSelectComponent,
    TooltipDirective,
  ],
  templateUrl: "./availability-event-dialog.component.html",
  styleUrl: "./availability-event-dialog.component.scss",
})
export class AvailabilityEventDialogComponent {
  private readonly i18n = inject(I18nService);
  private readonly dialogData = inject<AvailabilityEventDialogData | null>(
    DIALOG_DATA,
    { optional: true },
  );
  private readonly dialogRef = inject<
    DialogRef<AvailabilityEventDialogResult | undefined>
  >(DialogRef, { optional: true });
  private currentData!: AvailabilityEventDialogData;
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly save = new EventEmitter<AvailabilityEventDialogResult>();

  readonly form = new FormGroup(
    {
      mode: new FormControl<AvailabilityEventDialogMode>("single", {
        nonNullable: true,
      }),
      singleDate: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
      startDate: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
      endDate: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
      repeatEveryDays: new FormControl(DEFAULT_REPEAT_DAYS, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      startTime: new FormControl(DEFAULT_START_TIME, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      endTime: new FormControl(DEFAULT_END_TIME, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [availabilityEventValidator] },
  );

  constructor() {
    if (this.dialogData) {
      this.data = this.dialogData;
    }
  }

  @Input()
  set data(value: AvailabilityEventDialogData) {
    this.currentData = value;
    const singleDate = value.dateKey;
    const event = value.event;
    const mode =
      value.mode ??
      (event && event.startDate === event.endDate && event.repeatEveryDays === 1
        ? "single"
        : "recurring");
    this.form.reset({
      mode,
      singleDate: event?.startDate ?? singleDate,
      startDate: event?.startDate ?? singleDate,
      endDate: event?.endDate ?? this.addDays(singleDate, DEFAULT_REPEAT_DAYS),
      repeatEveryDays: event?.repeatEveryDays ?? DEFAULT_REPEAT_DAYS,
      startTime: event?.startTime ?? DEFAULT_START_TIME,
      endTime: event?.endTime ?? DEFAULT_END_TIME,
    });
  }

  get data() {
    return this.currentData;
  }

  isRecurring() {
    return this.form.controls.mode.value === "recurring";
  }

  setMode(mode: AvailabilityEventDialogMode) {
    this.form.controls.mode.setValue(mode);

    if (mode === "single") {
      const currentSingleDate =
        this.form.controls.singleDate.value || this.data.dateKey;
      this.form.controls.singleDate.setValue(currentSingleDate);
      return;
    }

    const startDate = this.form.controls.startDate.value || this.data.dateKey;
    this.form.controls.startDate.setValue(startDate);
    if (!this.form.controls.endDate.value) {
      this.form.controls.endDate.setValue(
        this.addDays(startDate, DEFAULT_REPEAT_DAYS),
      );
    }
  }

  adjustRepeatEvery(delta: number) {
    const control = this.form.controls.repeatEveryDays;
    const nextValue = Math.max(1, Number(control.value || 1) + delta);
    control.setValue(nextValue);
    control.markAsDirty();
    control.markAsTouched();
  }

  close() {
    this.dialogRef?.close();
    this.cancel.emit();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as AvailabilityEventDialogFormValue;

    if (value.mode === "single") {
      this.emitSave({
        startDate: value.singleDate,
        endDate: value.singleDate,
        repeatEveryDays: 1,
        startTime: value.startTime,
        endTime: value.endTime,
      });
      return;
    }

    this.emitSave({
      startDate: value.startDate,
      endDate: value.endDate,
      repeatEveryDays: value.repeatEveryDays,
      startTime: value.startTime,
      endTime: value.endTime,
    });
  }

  private emitSave(result: AvailabilityEventDialogResult) {
    this.dialogRef?.close(result);
    this.save.emit(result);
  }

  formatDateLabel(dateKey: string) {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString(
      this.localeName(),
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  }

  private localeName() {
    return this.i18n.locale() === "zh" ? "zh-CN" : this.i18n.locale();
  }

  actionLabel() {
    return "common.save";
  }

  private addDays(dateKey: string, days: number) {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }
}

function availabilityEventValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value =
    control.getRawValue() as Partial<AvailabilityEventDialogFormValue>;

  if (value.startTime && value.endTime && value.startTime >= value.endTime) {
    return { invalidTimeRange: true };
  }

  if (
    value.mode === "recurring" &&
    value.startDate &&
    value.endDate &&
    value.startDate > value.endDate
  ) {
    return { invalidDateRange: true };
  }

  return null;
}
