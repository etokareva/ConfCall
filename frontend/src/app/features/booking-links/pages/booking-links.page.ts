import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EMPTY, from } from "rxjs";
import { catchError, filter, switchMap, tap } from "rxjs/operators";
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

  copyPublicBookingLink(slug: string) {
    navigator.clipboard.writeText(this.publicBookingUrl(slug));
    this.toast.info(
      this.i18n.translate("settings.toast.link_copied_title"),
      this.i18n.translate("settings.toast.link_copied_message"),
    );
  }

  publicBookingUrl(slug: string) {
    return `${window.location.origin}/book/${slug}`;
  }

  deletePublicBookingLink(link: BookingLink) {
    from(
      this.modal.confirm({
        title: this.i18n.translate("settings.delete_link.title"),
        message: this.i18n.translate("settings.delete_link.message"),
        confirmText: this.i18n.translate("common.delete"),
      }),
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
