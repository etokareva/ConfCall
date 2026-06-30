import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import {
  BookingDialogData,
  BookingDialogResult,
} from "../../models/booking-dialog.model";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { ModalShellComponent } from "../../../../shared/components/modal-shell/modal-shell.component";

@Component({
  selector: "ccs-booking-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    ModalShellComponent,
  ],
  templateUrl: "./booking-dialog.component.html",
  styleUrl: "./booking-dialog.component.scss",
})
export class BookingDialogComponent {
  readonly form = new FormGroup({
    title: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl("", { nonNullable: true }),
  });

  constructor(
    public readonly dialogRef: DialogRef<BookingDialogResult>,
    @Inject(DIALOG_DATA) public readonly data: BookingDialogData,
  ) {
    this.form.reset({
      title: data.defaultTitle,
      description: data.defaultDescription,
    });
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description } = this.form.getRawValue();

    this.dialogRef.close({
      title: title.trim(),
      description: description.trim(),
    });
  }
}
