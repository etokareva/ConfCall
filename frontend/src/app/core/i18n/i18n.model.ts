import { AppLocale } from "../models/api.model";

export interface LanguageOption {
  value: AppLocale;
  label: string;
  nativeLabel: string;
}

export type TranslationDictionary = Record<string, string>;

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "ru", label: "Russian", nativeLabel: "Русский" },
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "es", label: "Spanish", nativeLabel: "Español" },
  { value: "zh", label: "Chinese", nativeLabel: "中文" },
];
