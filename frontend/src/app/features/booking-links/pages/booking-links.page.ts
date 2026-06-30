import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EMPTY, from } from "rxjs";
import { catchError, filter, switchMap, tap, finalize } from "rxjs/operators";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { TooltipDirective } from "../../../shared/components/tooltip/tooltip.directive";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { BookingService } from "../../../core/services/booking.service";
import { ToastService } from "../../../core/services/toast.service";
import { ModalService } from "../../../core/services/modal.service";
import { I18nService } from "../../../core/i18n/i18n.service";
import { BookingLink } from "../../../core/models/api.model";

@Component({
  selector: "ccs-booking-links-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    IconComponent,
    TooltipDirective,
    TranslatePipe,
  ],
  templateUrl: "./booking-links.page.html",
  styleUrl: "./booking-links.page.scss",
})
export class BookingLinksPage {
  booking = inject(BookingService);
  toast = inject(ToastService);
  modal = inject(ModalService);
  i18n = inject(I18nService);
  sendingLinkId = signal<number | null>(null);

  readonly sendForm = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email],
    }),
  });

  sendPublicBookingLink(link: BookingLink) {
    const emailControl = this.sendForm.controls.email;
    if (emailControl.invalid || !emailControl.value.trim()) {
      emailControl.markAsTouched();
      this.toast.info(
        this.i18n.translate("settings.toast.email_check_title"),
        this.i18n.translate("groups.booking_link_email_required"),
      );
      return;
    }

    const email = emailControl.value.trim().toLowerCase();
    this.sendingLinkId.set(link.id);
    this.booking
      .sendLink(link.id, email)
      .pipe(
        tap(() => {
          emailControl.reset("");
          this.toast.success(
            this.i18n.translate("groups.booking_link_sent_title"),
            this.i18n.translate("groups.booking_link_sent_message", { email }),
          );
        }),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("groups.booking_link_send_error_title"),
            this.i18n.translate("groups.booking_link_send_error_message"),
          );
          return EMPTY;
        }),
        finalize(() => this.sendingLinkId.set(null)),
      )
      .subscribe();
  }

  copyPublicBookingLink(slug: string) {
    navigator.clipboard.writeText(this.publicBookingUrl(slug));
    this.toast.info(
      this.i18n.translate("settings.toast.link_copied_title"),
      this.i18n.translate("settings.toast.link_copied_message"),
    );
  }

  openPublicBookingLink(slug: string) {
    window.open(this.publicBookingUrl(slug), "_blank", "noopener,noreferrer");
  }

  publicBookingUrl(slug: string) {
    return `${window.location.origin}/book/${slug}`;
  }

  togglePublicBookingLink(link: BookingLink) {
    this.booking
      .toggleLink(link.id)
      .pipe(
        tap((updated) =>
          this.toast.info(
            updated.isActive
              ? this.i18n.translate("settings.toast.link_enabled_title")
              : this.i18n.translate("settings.toast.link_disabled_title"),
            updated.isActive
              ? this.i18n.translate("settings.toast.link_enabled_message")
              : this.i18n.translate("settings.toast.link_disabled_message"),
          ),
        ),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("settings.toast.link_status_error_title"),
            this.i18n.translate("settings.toast.connection_retry_message"),
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deletePublicBookingLink(link: BookingLink) {
    from(
      this.modal.confirm(
        this.i18n.translate("settings.delete_link.title"),
        this.i18n.translate("settings.delete_link.message"),
        this.i18n.translate("common.delete"),
      ),
    )
      .pipe(
        filter(Boolean),
        switchMap(() => this.booking.deleteLink(link.id)),
        tap(() =>
          this.toast.success(
            this.i18n.translate("settings.toast.link_deleted_title"),
            this.i18n.translate("settings.toast.link_deleted_message"),
          ),
        ),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("settings.toast.link_delete_error_title"),
            this.i18n.translate("settings.toast.connection_retry_message"),
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
