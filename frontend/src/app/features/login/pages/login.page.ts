import { Component, DestroyRef, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { EMPTY } from "rxjs";
import { catchError, debounceTime, finalize, tap } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../core/services/auth.service";
import { I18nService } from "../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

type LoginMode = "login" | "register" | "reset";

@Component({
  selector: "ccs-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: "./login.page.html",
  styleUrl: "./login.page.scss",
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<LoginMode>("login");
  readonly loggingIn = signal(false);
  readonly registering = signal(false);
  readonly resetting = signal(false);
  readonly registrationSent = signal(false);
  readonly registrationEmail = signal("");
  readonly resetSent = signal(false);
  readonly resetEmail = signal("");
  readonly error = signal<string | null>(null);

  readonly loginForm = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  readonly resetRequestForm = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  readonly registerForm = new FormGroup({
    name: new FormControl("", { nonNullable: true }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  constructor() {
    this.bindErrorReset(this.loginForm);
    this.bindErrorReset(this.resetRequestForm);
    this.bindErrorReset(this.registerForm);
  }

  private bindErrorReset(form: FormGroup): void {
    form.valueChanges
      .pipe(
        debounceTime(250),
        tap(() => this.error.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  devLogin(): void {
    this.loggingIn.set(true);
    this.error.set(null);

    this.auth
      .devLogin()
      .pipe(
        tap(() => this.router.navigateByUrl(this.returnUrl())),
        catchError((err) => {
          this.error.set(err.message || this.i18n.translate("login.error"));
          return EMPTY;
        }),
        finalize(() => this.loggingIn.set(false)),
      )
      .subscribe();
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error.set(this.i18n.translate("login.login_error"));
      return;
    }

    this.loggingIn.set(true);
    this.error.set(null);
    const { email, password } = this.loginForm.getRawValue();

    this.auth
      .loginWithPassword({ email, password })
      .pipe(
        tap(() => this.router.navigateByUrl(this.returnUrl())),
        catchError((err) => {
          this.error.set(
            err.message || this.i18n.translate("login.login_error"),
          );
          return EMPTY;
        }),
        finalize(() => this.loggingIn.set(false)),
      )
      .subscribe();
  }

  requestPasswordReset(): void {
    if (this.resetRequestForm.invalid) {
      this.resetRequestForm.markAllAsTouched();
      this.error.set(this.i18n.translate("login.reset_email_required"));
      return;
    }

    this.resetting.set(true);
    this.error.set(null);
    const { email } = this.resetRequestForm.getRawValue();

    this.auth
      .requestPasswordReset({ email })
      .pipe(
        tap(({ email: resetEmail }) => {
          this.resetSent.set(true);
          this.resetEmail.set(resetEmail);
        }),
        catchError((err) => {
          this.error.set(
            err.message || this.i18n.translate("login.reset_error"),
          );
          return EMPTY;
        }),
        finalize(() => this.resetting.set(false)),
      )
      .subscribe();
  }

  register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.error.set(this.i18n.translate("login.register_error"));
      return;
    }

    this.registering.set(true);
    this.error.set(null);
    const { email, name, password } = this.registerForm.getRawValue();

    this.auth
      .register({ email, name: name || undefined, password })
      .pipe(
        tap(({ email: registrationEmail }) => {
          this.registrationSent.set(true);
          this.registrationEmail.set(registrationEmail);
        }),
        catchError((err) => {
          this.error.set(
            err.message || this.i18n.translate("login.register_error"),
          );
          return EMPTY;
        }),
        finalize(() => this.registering.set(false)),
      )
      .subscribe();
  }

  private returnUrl() {
    return this.route.snapshot.queryParamMap.get("returnUrl") ?? "/dashboard";
  }
}
