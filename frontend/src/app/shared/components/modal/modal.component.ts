import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { A11yModule } from "@angular/cdk/a11y";
import { ModalDialogData } from "../../models/modal-dialog.model";
import { ModalShellComponent } from "../modal-shell/modal-shell.component";

@Component({
  selector: "ccs-modal-dialog",
  standalone: true,
  imports: [CommonModule, A11yModule, ModalShellComponent],
  templateUrl: "./modal.component.html",
  styleUrl: "./modal.component.scss",
})
export class ModalDialogComponent {
  constructor(
    public readonly dialogRef: DialogRef<boolean | string>,
    @Inject(DIALOG_DATA) public readonly data: ModalDialogData,
  ) {}

  close(result: boolean | string = false) {
    this.dialogRef.close(result);
  }
}
