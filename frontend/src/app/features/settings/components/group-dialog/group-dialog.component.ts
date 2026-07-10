import { CommonModule } from "@angular/common";
import { Component, Inject, computed } from "@angular/core";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { ModalShellComponent } from "../../../../shared/components/modal-shell/modal-shell.component";
import { TooltipDirective } from "../../../../shared/components/tooltip/tooltip.directive";
import {
  GroupDialogData,
  GroupDialogResult,
} from "../../models/group-dialog.model";

@Component({
  selector: "ccs-group-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ModalShellComponent,
    ReactiveFormsModule,
    TooltipDirective,
    TranslatePipe,
  ],
  templateUrl: "./group-dialog.component.html",
  styleUrl: "./group-dialog.component.scss",
})
export class GroupDialogComponent {
  readonly groupForm = new FormGroup({
    name: new FormControl(this.data.groupName ?? "", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    avatar: new FormControl(this.data.avatar ?? "", { nonNullable: true }),
  });
  readonly inviteForm = new FormGroup({
    emails: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly isInvite = computed(() => this.data.mode === "invite");

  constructor(
    public readonly dialogRef: DialogRef<GroupDialogResult>,
    @Inject(DIALOG_DATA) public readonly data: GroupDialogData,
  ) {}

  titleKey() {
    if (this.data.mode === "invite") return "groups.invite_confirm_title";
    if (this.data.mode === "edit") return "groups.edit_group";
    return "groups.create_group_title";
  }

  subtitle() {
    if (this.data.mode === "create") {
      return "groups.create_group_subtitle";
    }

    return this.data.groupName ?? "";
  }

  submitLabelKey() {
    if (this.data.mode === "invite") return "groups.send_invitations";
    if (this.data.mode === "edit") return "common.save";
    return "groups.create";
  }

  submit() {
    if (this.isInvite()) {
      if (this.inviteForm.invalid) {
        this.inviteForm.markAllAsTouched();
        return;
      }

      const { emails } = this.inviteForm.getRawValue();
      this.dialogRef.close({ mode: "invite", emails });
      return;
    }

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    const { name, avatar } = this.groupForm.getRawValue();
    const mode = this.data.mode === "edit" ? "edit" : "create";
    this.dialogRef.close({ mode, name, avatar });
  }

  close() {
    this.dialogRef.close();
  }
}
