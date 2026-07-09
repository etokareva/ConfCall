import { CommonModule } from "@angular/common";
import { Component, Inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ConnectedPosition, OverlayModule } from "@angular/cdk/overlay";
import {
  BookingDialogData,
  BookingDialogResult,
} from "../../models/booking-dialog.model";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { ModalShellComponent } from "../../../../shared/components/modal-shell/modal-shell.component";
import { IconComponent } from "../../../../shared/components/icon/icon.component";

@Component({
  selector: "ccs-booking-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    TranslatePipe,
    ModalShellComponent,
    IconComponent,
  ],
  templateUrl: "./booking-dialog.component.html",
  styleUrl: "./booking-dialog.component.scss",
})
export class BookingDialogComponent {
  readonly durationOptions = [30, 45, 60, 90, 120];
  readonly durationOpen = signal(false);
  readonly durationOverlayPositions: ConnectedPosition[] = [
    {
      originX: "start",
      originY: "bottom",
      overlayX: "start",
      overlayY: "top",
      offsetY: 6,
    },
    {
      originX: "start",
      originY: "top",
      overlayX: "start",
      overlayY: "bottom",
      offsetY: -6,
    },
  ];
  readonly form = new FormGroup({
    title: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl("", { nonNullable: true }),
    durationMinutes: new FormControl(30, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    public readonly dialogRef: DialogRef<BookingDialogResult>,
    @Inject(DIALOG_DATA) public readonly data: BookingDialogData,
  ) {
    this.form.reset({
      title: data.defaultTitle,
      description: data.defaultDescription,
      durationMinutes: data.defaultDurationMinutes ?? 30,
    });
  }

  get isPublicLink() {
    return this.data.mode === "public-link";
  }

  get dialogTitleKey() {
    return this.isPublicLink
      ? "book.dialog.public_link_title"
      : "book.dialog.meeting_title_full";
  }

  get submitLabelKey() {
    return this.isPublicLink
      ? "book.dialog.create_link_action"
      : "book.dialog.create_meeting_action";
  }

  get titleLabelKey() {
    return this.isPublicLink
      ? "settings.link_title"
      : "book.dialog.title_field";
  }

  close() {
    this.dialogRef.close();
  }

  toggleDuration() {
    this.durationOpen.update((isOpen) => !isOpen);
  }

  closeDuration() {
    this.durationOpen.set(false);
  }

  selectDuration(durationMinutes: number) {
    this.form.controls.durationMinutes.setValue(durationMinutes);
    this.form.controls.durationMinutes.markAsDirty();
    this.closeDuration();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, durationMinutes } = this.form.getRawValue();

    this.dialogRef.close({
      title: title.trim(),
      description: description.trim() || undefined,
      ...(this.isPublicLink ? { durationMinutes } : {}),
    });
  }
}
