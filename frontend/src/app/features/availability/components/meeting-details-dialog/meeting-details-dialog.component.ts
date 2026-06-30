import { Component, Inject } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Meeting } from "../../../../core/models/api.model";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { ModalShellComponent } from "../../../../shared/components/modal-shell/modal-shell.component";

@Component({
  selector: "ccs-meeting-details-dialog",
  standalone: true,
  imports: [CommonModule, DatePipe, TranslatePipe, ModalShellComponent],
  templateUrl: "./meeting-details-dialog.component.html",
  styleUrl: "./meeting-details-dialog.component.scss",
})
export class MeetingDetailsDialogComponent {
  constructor(
    public readonly dialogRef: DialogRef<void>,
    @Inject(DIALOG_DATA) public readonly meeting: Meeting,
  ) {}

  close() {
    this.dialogRef.close();
  }

  statusKey() {
    return `meetings.status.${this.meeting.status}`;
  }
}
