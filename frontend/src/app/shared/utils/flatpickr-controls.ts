import type { Instance } from "flatpickr/dist/types/instance";
import { english } from "flatpickr/dist/l10n/default.js";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import { Russian } from "flatpickr/dist/l10n/ru.js";
import { Mandarin } from "flatpickr/dist/l10n/zh.js";
import type { CustomLocale, Locale } from "flatpickr/dist/types/locale";
import { AppLocale } from "../../core/models/api.model";

export interface FlatpickrControlLabels {
  monthLabel: string;
  yearLabel: string;
  idPrefix: string;
}

export const FLATPICKR_NEXT_ARROW = '<span aria-hidden="true">›</span>';
export const FLATPICKR_PREV_ARROW = '<span aria-hidden="true">‹</span>';

export function getFlatpickrLocale(locale: AppLocale): Locale | CustomLocale {
  const locales: Record<AppLocale, Locale | CustomLocale> = {
    en: english,
    es: Spanish,
    ru: Russian,
    zh: Mandarin,
  };

  return locales[locale];
}

export function isFlatpickrInstance(value: unknown): value is Instance {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Instance).destroy === "function" &&
    typeof (value as Instance).open === "function"
  );
}

export function prepareFlatpickrControls(
  instance: Instance,
  labels: FlatpickrControlLabels,
) {
  const { calendarContainer } = instance;
  const monthSelect = calendarContainer.querySelector<HTMLSelectElement>(
    ".flatpickr-monthDropdown-months",
  );
  const yearInput =
    calendarContainer.querySelector<HTMLInputElement>(".cur-year");
  const { idPrefix, monthLabel, yearLabel } = labels;

  if (monthSelect) {
    monthSelect.id = `${idPrefix}-month`;
    monthSelect.name = monthSelect.id;
    monthSelect.classList.add("flatpickr-control");
    monthSelect.setAttribute("aria-label", monthLabel);
  }

  if (yearInput) {
    yearInput.id = `${idPrefix}-year`;
    yearInput.name = yearInput.id;
    yearInput.classList.add("flatpickr-control", "control-input--center");
    yearInput.setAttribute("aria-label", yearLabel);
  }

  decorateFlatpickrCalendar(instance);
}

export function decorateFlatpickrCalendar(instance: Instance) {
  const { calendarContainer } = instance;
  const classes = {
    legacyCalendar: "confcall-datepicker",
    calendar: "ccs-flatpickr-calendar",
    months: "ccs-flatpickr-months",
    month: "ccs-flatpickr-month",
    currentMonth: "ccs-flatpickr-current-month",
    monthSelect: "ccs-flatpickr-month-select",
    yearInput: "ccs-flatpickr-year-input",
    prevButton: ["ccs-flatpickr-nav", "ccs-flatpickr-nav--prev"],
    nextButton: ["ccs-flatpickr-nav", "ccs-flatpickr-nav--next"],
    weekdays: "ccs-flatpickr-weekdays",
    days: "ccs-flatpickr-days",
    dayContainer: "ccs-flatpickr-day-container",
    day: "ccs-flatpickr-day",
  } as const;

  calendarContainer.classList.add(classes.legacyCalendar, classes.calendar);

  calendarContainer
    .querySelector(".flatpickr-months")
    ?.classList.add(classes.months);
  calendarContainer
    .querySelector(".flatpickr-month")
    ?.classList.add(classes.month);
  calendarContainer
    .querySelector(".flatpickr-current-month")
    ?.classList.add(classes.currentMonth);
  calendarContainer
    .querySelector(".flatpickr-monthDropdown-months")
    ?.classList.add(classes.monthSelect);
  calendarContainer
    .querySelector(".cur-year")
    ?.classList.add(classes.yearInput);
  calendarContainer
    .querySelector(".flatpickr-prev-month")
    ?.classList.add(...classes.prevButton);
  calendarContainer
    .querySelector(".flatpickr-next-month")
    ?.classList.add(...classes.nextButton);
  calendarContainer
    .querySelector(".flatpickr-weekdays")
    ?.classList.add(classes.weekdays);
  calendarContainer
    .querySelector(".flatpickr-days")
    ?.classList.add(classes.days);
  calendarContainer
    .querySelector(".dayContainer")
    ?.classList.add(classes.dayContainer);
  calendarContainer.querySelectorAll(".flatpickr-day").forEach((day) => {
    day.classList.add(classes.day);
  });
}
