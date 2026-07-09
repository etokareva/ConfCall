import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { EMPTY } from "rxjs";
import { catchError, finalize, tap } from "rxjs/operators";
import { BookingService } from "../../../core/services/booking.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { IconComponent } from "../../../shared/components/icon/icon.component";

@Component({
  selector: "ccs-public-booking-cancel",
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, IconComponent],
  template: `
    <section class="public-cancel" [attr.aria-busy]="loading()">
      <section class="cancel-card">
        @if (loading()) {
          <span class="status-icon loading">
            <svg-icon name="clock"></svg-icon>
          </span>
          <h1>{{ "public_booking.cancel.loading_title" | t }}</h1>
          <p>{{ "public_booking.cancel.loading_message" | t }}</p>
        } @else if (error()) {
          <span class="status-icon error">
            <svg-icon name="alert"></svg-icon>
          </span>
          <h1>{{ "public_booking.cancel.error_title" | t }}</h1>
          <p>{{ "public_booking.cancel.error_message" | t }}</p>
        } @else {
          <span class="status-icon success">
            <svg-icon name="check"></svg-icon>
          </span>
          <h1>
            {{
              (alreadyCancelled()
                ? "public_booking.cancel.already_title"
                : "public_booking.cancel.success_title"
              ) | t
            }}
          </h1>
          <p>
            {{
              (alreadyCancelled()
                ? "public_booking.cancel.already_message"
                : "public_booking.cancel.success_message"
              ) | t
            }}
          </p>
        }
        <a routerLink="/" class="home-link">{{ "nav.home" | t }}</a>
      </section>
    </section>
  `,
  styles: [
    `
      .public-cancel {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: var(--color-bg);
        color: var(--color-text);
        padding: var(--space-6);
      }

      .cancel-card {
        width: min(100%, 32rem);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
        border: 1px solid var(--color-border-card);
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        box-shadow: var(--shadow-lg);
        padding: var(--space-6);
      }

      .status-icon {
        width: 3rem;
        height: 3rem;
        display: inline-grid;
        place-items: center;
        border-radius: var(--radius-md);
      }

      .status-icon.success {
        background: var(--overlay-success);
        color: var(--color-success);
      }

      .status-icon.error {
        background: var(--overlay-danger);
        color: var(--color-danger-soft);
      }

      .status-icon.loading {
        background: var(--overlay-primary);
        color: var(--color-primary-soft);
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        color: var(--color-text-strong);
        font-size: var(--font-size-2xl);
      }

      p {
        color: var(--color-text-muted);
        line-height: 1.6;
      }

      .home-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: var(--control-height-md);
        border-radius: var(--radius-sm);
        background: var(--color-primary);
        color: var(--color-text-inverse);
        font-weight: 700;
        text-decoration: none;
        padding: 0 var(--space-4);
      }
    `,
  ],
})
export class PublicBookingCancelPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly alreadyCancelled = signal(false);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get("token");
    if (!token) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.booking
      .cancelPublicMeeting(token)
      .pipe(
        tap(({ alreadyCancelled }) =>
          this.alreadyCancelled.set(alreadyCancelled),
        ),
        catchError(() => {
          this.error.set(true);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
}
