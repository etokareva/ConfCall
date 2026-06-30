import { Component, inject } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

interface HomeFeature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

interface HomeStep {
  readonly index: string;
  readonly title: string;
  readonly description: string;
}

interface VisualCalendarCell {
  readonly day: number;
  readonly kind: "free" | "busy";
  readonly slotCount: number;
}

@Component({
  selector: "ccs-home-page",
  standalone: true,
  imports: [NavbarComponent, IconComponent, TranslatePipe],
  templateUrl: "./home.page.html",
  styleUrl: "./home.page.scss",
})
export class HomePage {
  readonly auth = inject(AuthService);

  readonly steps: HomeStep[] = [
    {
      index: "01",
      title: "home.step.groups.title",
      description: "home.step.groups.description",
    },
    {
      index: "02",
      title: "home.step.availability.title",
      description: "home.step.availability.description",
    },
    {
      index: "03",
      title: "home.step.booking.title",
      description: "home.step.booking.description",
    },
  ];

  readonly features: HomeFeature[] = [
    {
      icon: "users",
      title: "home.feature.groups.title",
      description: "home.feature.groups.description",
    },
    {
      icon: "calendar",
      title: "home.feature.availability.title",
      description: "home.feature.availability.description",
    },
    {
      icon: "clock",
      title: "home.feature.booking.title",
      description: "home.feature.booking.description",
    },
  ];

  readonly visualWeekdays = [
    "weekday.mon.short",
    "weekday.tue.short",
    "weekday.wed.short",
    "weekday.thu.short",
    "weekday.fri.short",
    "weekday.sat.short",
    "weekday.sun.short",
  ];

  readonly visualCalendar: VisualCalendarCell[] = [
    { day: 26, kind: "free", slotCount: 1 },
    { day: 27, kind: "free", slotCount: 1 },
    { day: 28, kind: "busy", slotCount: 0 },
    { day: 29, kind: "free", slotCount: 2 },
    { day: 30, kind: "free", slotCount: 1 },
    { day: 31, kind: "busy", slotCount: 0 },
    { day: 1, kind: "free", slotCount: 2 },
    { day: 2, kind: "free", slotCount: 1 },
    { day: 3, kind: "busy", slotCount: 0 },
    { day: 4, kind: "free", slotCount: 2 },
    { day: 5, kind: "free", slotCount: 1 },
    { day: 6, kind: "free", slotCount: 1 },
    { day: 7, kind: "busy", slotCount: 0 },
    { day: 8, kind: "free", slotCount: 2 },
    { day: 9, kind: "free", slotCount: 1 },
    { day: 10, kind: "free", slotCount: 1 },
    { day: 11, kind: "busy", slotCount: 0 },
    { day: 12, kind: "free", slotCount: 2 },
    { day: 13, kind: "free", slotCount: 1 },
    { day: 14, kind: "busy", slotCount: 0 },
    { day: 15, kind: "free", slotCount: 2 },
    { day: 16, kind: "free", slotCount: 1 },
    { day: 17, kind: "free", slotCount: 1 },
    { day: 18, kind: "busy", slotCount: 0 },
    { day: 19, kind: "free", slotCount: 2 },
    { day: 20, kind: "free", slotCount: 1 },
    { day: 21, kind: "free", slotCount: 1 },
    { day: 22, kind: "busy", slotCount: 0 },
    { day: 23, kind: "free", slotCount: 2 },
    { day: 24, kind: "free", slotCount: 1 },
    { day: 25, kind: "busy", slotCount: 0 },
    { day: 26, kind: "free", slotCount: 1 },
    { day: 27, kind: "free", slotCount: 2 },
    { day: 28, kind: "free", slotCount: 1 },
    { day: 29, kind: "busy", slotCount: 0 },
  ];
}
