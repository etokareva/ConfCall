import { Injectable, signal, computed } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map, shareReplay, switchMap, tap } from "rxjs/operators";
import { ApiClientService } from "./api-client.service";
import {
  AppLocale,
  LoginWithPasswordResponse,
  RegisterResponse,
  RegisterWithInviteResponse,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
  ResendVerificationResponse,
  User,
  VerifyEmailResponse,
} from "../models/api.model";
import { I18nService } from "../i18n/i18n.service";

interface DevLoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private token$ = new BehaviorSubject<string | null>(
    localStorage.getItem("auth_token"),
  );
  private readonly readySignal = signal(false);
  private readonly ready$ = new BehaviorSubject(
    localStorage.getItem("auth_token") === null,
  );
  private readonly authUser$ = new BehaviorSubject<User | null>(null);

  private readonly userState$ = this.token$.pipe(
    switchMap((t) =>
      t
        ? this.client.get<User>("/auth/me").pipe(
            catchError(() => {
              this.clearAuthenticatedState();
              return of(null);
            }),
          )
        : of(null),
    ),
    tap((u) => {
      this.authUser$.next(u);
      this.userSignal.set(u);
      this.i18n.syncUserLocale(u?.locale);
      this.readySignal.set(true);
      this.ready$.next(true);
    }),
    shareReplay(1),
  );
  user$: Observable<User | null> = this.authUser$.asObservable();

  private userSignal = signal<User | null>(null);
  readonly user = this.userSignal.asReadonly();
  readonly ready = this.readySignal.asReadonly();
  isAuthenticated = computed(() => this.userSignal() !== null);
  isAdmin = computed(() => this.userSignal()?.role === "admin");

  constructor(
    private client: ApiClientService,
    private i18n: I18nService,
  ) {
    this.userState$.subscribe();
  }

  devLogin(): Observable<User> {
    return this.client.post<DevLoginResponse>("/auth/dev-login", {}).pipe(
      tap(({ token, user }) => {
        this.applyAuthenticatedState(token, user);
      }),
      map(({ user }) => user),
    );
  }

  registerWithInvite(payload: {
    email: string;
    name?: string;
    inviteToken: string;
    password: string;
  }): Observable<RegisterWithInviteResponse> {
    return this.client
      .post<RegisterWithInviteResponse>("/auth/register-with-invite", payload)
      .pipe(
        tap(({ token, user }) => {
          this.applyAuthenticatedState(token, user);
        }),
      );
  }

  resendVerificationEmail(payload: {
    email: string;
  }): Observable<ResendVerificationResponse> {
    return this.client.post<ResendVerificationResponse>(
      "/auth/resend-verification",
      payload,
    );
  }

  loginWithPassword(payload: {
    email: string;
    password: string;
  }): Observable<User> {
    return this.client
      .post<LoginWithPasswordResponse>("/auth/login", payload)
      .pipe(
        tap(({ token, user }) => {
          this.applyAuthenticatedState(token, user);
        }),
        map(({ user }) => user),
      );
  }

  register(payload: {
    email: string;
    name?: string;
    password: string;
  }): Observable<RegisterResponse> {
    return this.client.post<RegisterResponse>("/auth/register", payload);
  }

  verifyEmail(token: string): Observable<User> {
    return this.client
      .post<VerifyEmailResponse>("/auth/verify-email", { token })
      .pipe(
        tap(({ token: authToken, user }) => {
          this.applyAuthenticatedState(authToken, user);
        }),
        map(({ user }) => user),
      );
  }

  requestPasswordReset(payload: {
    email: string;
  }): Observable<RequestPasswordResetResponse> {
    return this.client.post<RequestPasswordResetResponse>(
      "/auth/password-reset/request",
      payload,
    );
  }

  resetPassword(payload: {
    token: string;
    password: string;
  }): Observable<User> {
    return this.client
      .post<ResetPasswordResponse>("/auth/password-reset/confirm", payload)
      .pipe(
        tap(({ token, user }) => {
          this.applyAuthenticatedState(token, user);
        }),
        map(({ user }) => user),
      );
  }

  updateProfile(payload: {
    name?: string;
    avatar?: string;
    locale?: AppLocale;
  }): Observable<User> {
    return this.client.patch<User>("/auth/me", payload).pipe(
      tap((user) => {
        this.authUser$.next(user);
        this.userSignal.set(user);
        this.i18n.syncUserLocale(user.locale);
      }),
    );
  }

  logout(): void {
    this.clearAuthenticatedState();
    window.location.href = "/";
  }

  readonly authReady$ = this.ready$.asObservable();

  getLoginUrl(): string {
    return "/login";
  }

  private clearAuthenticatedState(): void {
    localStorage.removeItem("auth_token");
    this.token$.next(null);
    this.authUser$.next(null);
    this.readySignal.set(true);
    this.ready$.next(true);
    this.userSignal.set(null);
  }

  private applyAuthenticatedState(token: string, user: User): void {
    localStorage.setItem("auth_token", token);
    this.token$.next(token);
    this.authUser$.next(user);
    this.userSignal.set(user);
    this.i18n.syncUserLocale(user.locale);
    this.readySignal.set(true);
    this.ready$.next(true);
  }
}
