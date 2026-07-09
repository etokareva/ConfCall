import { Injectable, inject } from "@angular/core";
import { Dialog } from "@angular/cdk/dialog";
import { firstValueFrom } from "rxjs";
import { BookingDialogComponent } from "../components/booking-dialog/booking-dialog.component";
import {
  BookingDialogData,
  BookingDialogResult,
} from "../models/booking-dialog.model";

@Injectable({ providedIn: "root" })
export class BookingDialogService {
  private readonly dialog = inject(Dialog);
  private readonly baseConfig = {
    hasBackdrop: true,
    ariaModal: true,
    restoreFocus: true,
    maxWidth: "calc(100vw - 2rem)",
    backdropClass: "app-dialog-backdrop",
    panelClass: "ccs-dialog-panel",
  };

  openPublicLink(data: BookingDialogData) {
    return this.open(data, {
      autoFocus: "first-tabbable",
      width: "560px",
    });
  }

  openMeeting(data: BookingDialogData) {
    return this.open(data, {
      autoFocus: "dialog",
      disableClose: false,
      width: "500px",
    });
  }

  private open(
    data: BookingDialogData,
    config: {
      autoFocus: "dialog" | "first-tabbable";
      disableClose?: boolean;
      width: string;
    },
  ) {
    const ref = this.dialog.open<
      BookingDialogResult,
      BookingDialogData,
      BookingDialogComponent
    >(BookingDialogComponent, {
      ...this.baseConfig,
      ...config,
      data,
    });

    return firstValueFrom(ref.closed);
  }
}

