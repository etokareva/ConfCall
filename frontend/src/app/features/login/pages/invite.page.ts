import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { EMPTY } from "rxjs";
import { catchError, finalize, tap } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../core/services/auth.service";
import { GroupService } from "../../../core/services/group.service";
import { I18nService } from "../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

@Component({
  selector: "ccs-invite",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: "./invite.page.html",
  styleUrl: "./invite.page.scss",
})
export class InvitePage {
  readonly auth = inject(AuthService);
  private readonly groups = inject(GroupService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly acceptLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly invitation = signal<{
    groupName?: string;
    email: string;
    token: string;
    status: string;
  } | null>(null);

  readonly form = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    name: new FormControl("", { nonNullable: true }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  constructor() {
    this.route.queryParamMap
      .pipe(
        tap((params) => {
          const token = params.get("token");
          if (!token) {
            this.error.set(this.i18n.translate("invite.token_missing"));
            this.loading.set(false);
            return;
          }

          this.groups
            .getInvitation(token)
            .pipe(
              tap((invitation) => {
                this.invitation.set(invitation);
                this.form.patchValue(
                  {
                    email: invitation.email,
                  },
                  { emitEvent: false },
                );
              }),
              catchError((err) => {
                this.error.set(
                  err.message || this.i18n.translate("invite.load_error"),
                );
                return EMPTY;
              }),
              finalize(() => this.loading.set(false)),
            )
            .subscribe();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  register(): void {
    const invitation = this.invitation();
    if (!invitation || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, name, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .registerWithInvite({
        email,
        name: name || undefined,
        password,
        inviteToken: invitation.token,
      })
      .pipe(
        tap(() =>
          this.router.navigateByUrl("/dashboard", { replaceUrl: true }),
        ),
        catchError((err) => {
          this.error.set(
            err.message || this.i18n.translate("invite.register_error"),
          );
          return EMPTY;
        }),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe();
  }

  accept(): void {
    const invitation = this.invitation();
    if (!invitation) {
      return;
    }

    this.acceptLoading.set(true);
    this.error.set(null);

    this.groups
      .acceptInvitation(invitation.token)
      .pipe(
        tap(() =>
          this.router.navigateByUrl("/dashboard", { replaceUrl: true }),
        ),
        catchError((err) => {
          this.error.set(
            err.message || this.i18n.translate("invite.accept_error"),
          );
          return EMPTY;
        }),
        finalize(() => this.acceptLoading.set(false)),
      )
      .subscribe();
  }
}
