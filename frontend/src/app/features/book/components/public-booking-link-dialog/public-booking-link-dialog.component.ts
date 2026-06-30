import { CommonModule } from "@angular/common";
import { Component, Inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ConnectedPosition, OverlayModule } from "@angular/cdk/overlay";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { ModalShellComponent } from "../../../../shared/components/modal-shell/modal-shell.component";
import { IconComponent } from "../../../../shared/components/icon/icon.component";
import {
  PublicBookingLinkDialogData,
  PublicBookingLinkDialogResult,
} from "../../models/public-booking-link-dialog.model";

@Component({
  selector: "ccs-public-booking-link-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    TranslatePipe,
    ModalShellComponent,
    IconComponent,
  ],
  templateUrl: "./public-booking-link-dialog.component.html",
  styleUrl: "./public-booking-link-dialog.component.scss",
})
export class PublicBookingLinkDialogComponent {
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
    public readonly dialogRef: DialogRef<PublicBookingLinkDialogResult>,
    @Inject(DIALOG_DATA)
    public readonly data: PublicBookingLinkDialogData,
  ) {
    this.form.reset({
      title: data.defaultTitle,
      description: data.defaultDescription,
      durationMinutes: data.defaultDurationMinutes,
    });
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
      durationMinutes,
    });
  }
}
