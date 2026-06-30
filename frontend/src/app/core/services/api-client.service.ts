import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { I18nService } from "../i18n/i18n.service";

interface ApiErrorResponse {
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  message?: string | string[];
}

@Injectable({ providedIn: "root" })
export class ApiClientService {
  private readonly base = "/api";

  constructor(
    private http: HttpClient,
    private i18n: I18nService,
  ) {}

  get<T>(path: string): Observable<T> {
    return this.http
      .get<T>(`${this.base}${path}`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.base}${path}`, body, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(`${this.base}${path}`, body, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  postEmpty<T>(path: string): Observable<T> {
    return this.http
      .post<T>(`${this.base}${path}`, {}, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem("auth_token");
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  private handleError = (err: HttpErrorResponse): Observable<never> => {
    const translatedMessage = this.translateError(err.error);
    return throwError(() => new Error(translatedMessage));
  };

  private translateError(error: unknown): string {
    if (!error || typeof error !== "object") {
      return this.i18n.translate("common.check_data_retry");
    }

    const payload = error as ApiErrorResponse;
    if (payload.messageKey) {
      return this.i18n.translate(payload.messageKey, payload.messageParams);
    }

    if (typeof payload.message === "string") {
      const translated = this.i18n.translate(payload.message);
      if (translated !== payload.message) {
        return translated;
      }
    }

    if (Array.isArray(payload.message) && payload.message.length > 0) {
      return this.i18n.translate("common.check_data_retry");
    }

    return this.i18n.translate("common.check_data_retry");
  }
}
