import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import { Dialog } from "@angular/cdk/dialog";
import { ModalDialogComponent } from "../../shared/components/modal/modal.component";
import {
  ModalDialogAction,
  ModalDialogData,
} from "../../shared/models/modal-dialog.model";
import { I18nService } from "../i18n/i18n.service";

export type ModalKind = "info" | "error" | "confirm";

@Injectable({ providedIn: "root" })
export class ModalService {
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);

  info(
    title: string,
    message: string,
    confirmText = this.i18n.translate("common.ok"),
  ) {
    return this.open("info", title, message, confirmText);
  }

  error(
    title: string,
    message: string,
    confirmText = this.i18n.translate("common.ok"),
  ) {
    return this.open("error", title, message, confirmText);
  }

  confirm(
    title: string,
    message: string,
    confirmText = this.i18n.translate("common.confirm"),
    cancelText = this.i18n.translate("common.cancel"),
  ) {
    return this.open("confirm", title, message, confirmText, cancelText);
  }

  choose(
    title: string,
    message: string,
    actions: ModalDialogAction[],
  ): Promise<string | null> {
    return this.openChoice(title, message, actions);
  }

  private open(
    kind: ModalKind,
    title: string,
    message: string,
    confirmText: string,
    cancelText = this.i18n.translate("common.cancel"),
  ) {
    const data: ModalDialogData = {
      kind,
      title,
      message,
      confirmText,
      cancelText,
    };
    const ref = this.dialog.open<
      boolean,
      ModalDialogData,
      ModalDialogComponent
    >(ModalDialogComponent, {
      data,
      hasBackdrop: true,
      ariaModal: true,
      autoFocus: "dialog",
      restoreFocus: true,
      disableClose: false,
      width: "420px",
      maxWidth: "calc(100vw - 2rem)",
      backdropClass: "app-dialog-backdrop",
    });

    return firstValueFrom(ref.closed.pipe(map((result) => result ?? false)));
  }

  private openChoice(
    title: string,
    message: string,
    actions: ModalDialogAction[],
  ) {
    const data: ModalDialogData = {
      kind: "confirm",
      title,
      message,
      confirmText: this.i18n.translate("common.confirm"),
      cancelText: this.i18n.translate("common.cancel"),
      actions,
    };
    const ref = this.dialog.open<
      string | null,
      ModalDialogData,
      ModalDialogComponent
    >(ModalDialogComponent, {
      data,
      hasBackdrop: true,
      ariaModal: true,
      autoFocus: "dialog",
      restoreFocus: true,
      disableClose: false,
      width: "460px",
      maxWidth: "calc(100vw - 2rem)",
      backdropClass: "app-dialog-backdrop",
    });

    return firstValueFrom(ref.closed.pipe(map((result) => result ?? null)));
  }
}
