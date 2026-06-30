import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, signal } from "@angular/core";
import { AppLocale } from "../models/api.model";
import { LANGUAGE_OPTIONS } from "./i18n.model";
import { TRANSLATIONS } from "./translations";

const LOCALE_STORAGE_KEY = "app_locale";
const SUPPORTED_LOCALES: AppLocale[] = ["ru", "en", "es", "zh"];

@Injectable({ providedIn: "root" })
export class I18nService {
  private readonly localeSignal = signal<AppLocale>(this.initialLocale());
  readonly locale = this.localeSignal.asReadonly();
  readonly languages = LANGUAGE_OPTIONS;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.applyDocumentLocale(this.localeSignal());
  }

  setLocale(locale: AppLocale) {
    this.localeSignal.set(locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    this.applyDocumentLocale(locale);
  }

  syncUserLocale(locale?: AppLocale | null) {
    if (locale && SUPPORTED_LOCALES.includes(locale)) {
      this.setLocale(locale);
    }
  }

  translate(
    value: string | null | undefined,
    params?: Record<string, string | number>,
  ) {
    if (!value) return value ?? "";
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return value;

    const locale = this.localeSignal();
    const key = this.normalizeKey(normalized);
    const translated =
      TRANSLATIONS[locale][key] ?? TRANSLATIONS.ru[key] ?? value;

    if (!params) return translated;

    return Object.entries(params).reduce(
      (text, [paramKey, paramValue]) =>
        text.replaceAll(`{${paramKey}}`, String(paramValue)),
      translated,
    );
  }

  private initialLocale(): AppLocale {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (this.isLocale(stored)) return stored;

    const browserLocale = navigator.language.slice(0, 2);
    return this.isLocale(browserLocale) ? browserLocale : "ru";
  }

  private isLocale(value: string | null): value is AppLocale {
    return SUPPORTED_LOCALES.includes(value as AppLocale);
  }

  private applyDocumentLocale(locale: AppLocale) {
    this.document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
  }

  private normalizeKey(value: string) {
    return value.trim().toLowerCase();
  }
}
