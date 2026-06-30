import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { EMPTY } from "rxjs";
import { catchError, finalize, tap } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../core/services/auth.service";
import { I18nService } from "../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

@Component({
  selector: "ccs-verify-email",
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: "./verify-email.page.html",
  styleUrl: "./verify-email.page.scss",
})
export class VerifyEmailPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  loading = signal(true);
  done = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const token = params.get("token")?.trim();
        if (!token) {
          this.loading.set(false);
          this.error.set(
            this.i18n.translate("login.verification_token_missing"),
          );
          return;
        }

        this.auth
          .verifyEmail(token)
          .pipe(
            tap(() => {
              this.done.set(true);
              void this.router.navigateByUrl("/dashboard");
            }),
            catchError((err) => {
              this.error.set(
                err.message || this.i18n.translate("login.verification_error"),
              );
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          )
          .subscribe();
      });
  }
}
