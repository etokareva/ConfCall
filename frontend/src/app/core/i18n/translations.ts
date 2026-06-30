import { AppLocale } from "../models/api.model";
import { TranslationDictionary } from "./i18n.model";
import { EN_TRANSLATIONS } from "./dictionaries/en";
import { ES_TRANSLATIONS } from "./dictionaries/es";
import { RU_TRANSLATIONS } from "./dictionaries/ru";
import { ZH_TRANSLATIONS } from "./dictionaries/zh";

export const TRANSLATIONS: Record<AppLocale, TranslationDictionary> = {
  ru: RU_TRANSLATIONS,
  en: EN_TRANSLATIONS,
  es: ES_TRANSLATIONS,
  zh: ZH_TRANSLATIONS,
};
