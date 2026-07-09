import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import { Dialog } from "@angular/cdk/dialog";
import { ModalDialogComponent } from "../../shared/components/modal/modal.component";
import {
  ModalDialogData,
  ModalChoiceOptions,
  ModalMessageOptions,
} from "../../shared/models/modal-dialog.model";
import { I18nService } from "../i18n/i18n.service";

export type ModalKind = "info" | "error" | "confirm";

@Injectable({ providedIn: "root" })
export class ModalService {
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly dialogBaseConfig = {
    hasBackdrop: true,
    ariaModal: true,
    autoFocus: "dialog",
    restoreFocus: true,
    disableClose: false,
    maxWidth: "calc(100vw - 2rem)",
    backdropClass: "app-dialog-backdrop",
  };

  info(options: ModalMessageOptions) {
    return this.open("info", options);
  }

  error(options: ModalMessageOptions) {
    return this.open("error", options);
  }

  confirm(options: ModalMessageOptions) {
    return this.open("confirm", options);
  }

  choose(options: ModalChoiceOptions): Promise<string | null> {
    return this.openChoice(options);
  }

  private open(kind: ModalKind, options: ModalMessageOptions) {
    const { title, message, confirmText, cancelText } = options;
    const data: ModalDialogData = {
      kind,
      title,
      message,
      confirmText:
        confirmText ??
        (kind === "confirm"
          ? this.i18n.translate("common.confirm")
          : this.i18n.translate("common.ok")),
      cancelText: cancelText ?? this.i18n.translate("common.cancel"),
    };
    const ref = this.openDialog<boolean>(data, { width: "420px" });

    return firstValueFrom(ref.closed.pipe(map((result) => result ?? false)));
  }

  private openChoice(options: ModalChoiceOptions) {
    const { title, message, actions, confirmText, cancelText } = options;
    const data: ModalDialogData = {
      kind: "confirm",
      title,
      message,
      confirmText: confirmText ?? this.i18n.translate("common.confirm"),
      cancelText: cancelText ?? this.i18n.translate("common.cancel"),
      actions,
    };
    const ref = this.openDialog<string | null>(data, { width: "460px" });

    return firstValueFrom(ref.closed.pipe(map((result) => result ?? null)));
  }

  private openDialog<Result>(
    data: ModalDialogData,
    config: { width: string },
  ) {
    return this.dialog.open<Result, ModalDialogData, ModalDialogComponent>(
      ModalDialogComponent,
      {
        ...this.dialogBaseConfig,
        ...config,
        data,
      },
    );
  }
}
