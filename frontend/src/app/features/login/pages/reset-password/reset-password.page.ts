import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EMPTY } from "rxjs";
import { catchError, finalize, tap } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../../core/services/auth.service";
import { I18nService } from "../../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";

@Component({
  selector: "ccs-reset-password",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: "./reset-password.page.html",
  styleUrl: "./reset-password.page.scss",
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  saving = signal(false);
  done = signal(false);
  error = signal<string | null>(null);
  private token = "";

  readonly form = new FormGroup(
    {
      password: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: [
        (group) => {
          const password = group.get("password")?.value;
          const confirmPassword = group.get("confirmPassword")?.value;
          return password === confirmPassword ? null : { mismatch: true };
        },
      ],
    },
  );

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const token = params.get("token")?.trim();
        if (!token) {
          this.loading.set(false);
          this.error.set(this.i18n.translate("login.reset_token_missing"));
          return;
        }

        this.token = token;
        this.loading.set(false);
      });

    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.error.set(null)),
      )
      .subscribe();
  }

  save(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      this.error.set(this.i18n.translate("login.reset_form_invalid"));
      return;
    }

    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.error.set(this.i18n.translate("login.passwords_mismatch"));
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.auth
      .resetPassword({ token: this.token, password })
      .pipe(
        tap(() => {
          this.done.set(true);
          void this.router.navigateByUrl("/dashboard");
        }),
        catchError((err) => {
          this.error.set(
            err.message || this.i18n.translate("login.reset_error"),
          );
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe();
  }
}
