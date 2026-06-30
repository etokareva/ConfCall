import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

import { AuthService } from "../../../core/services/auth.service";
import { AvailabilityService } from "../../../core/services/availability.service";
import { MeetingService } from "../../../core/services/meeting.service";
import { BookingService } from "../../../core/services/booking.service";
import { DashboardStats } from "../models/dashboard.model";
import { Meeting } from "../../../core/models/api.model";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { I18nService } from "../../../core/i18n/i18n.service";

interface DashboardActionItem {
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: "ccs-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavbarComponent,
    IconComponent,
    TranslatePipe,
  ],
  templateUrl: "./dashboard.page.html",
  styleUrl: "./dashboard.page.scss",
})
export class DashboardPage {
  auth = inject(AuthService);
  avail = inject(AvailabilityService);
  meetings = inject(MeetingService);
  booking = inject(BookingService);
  i18n = inject(I18nService);

  vm$: Observable<
    DashboardStats & {
      newMeetings: number;
      upcomingMeetings: ReturnType<DashboardPage["getUpcomingMeetings"]>;
      activeLinks: number;
      hasAvailability: boolean;
    }
  > = combineLatest([
    this.meetings.meetings$,
    this.avail.slots$,
    this.avail.events$,
    this.booking.links$,
  ]).pipe(
    map(([m, s, e, l]) => {
      const availabilityCount = s.length + e.length;

      return {
        meetings: m.length,
        slots: availabilityCount,
        links: l.length,
        newMeetings: m.filter(
          (meeting) => meeting.isNew && meeting.status === "scheduled",
        ).length,
        upcomingMeetings: this.getUpcomingMeetings(m),
        activeLinks: l.filter((link) => link.isActive).length,
        hasAvailability: availabilityCount > 0,
      };
    }),
  );

  private getUpcomingMeetings(meetings: Meeting[]) {
    const now = Date.now();
    return meetings
      .filter(
        (meeting) =>
          meeting.status === "scheduled" &&
          new Date(meeting.startTime).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )
      .slice(0, 3);
  }

  formatDateTime(value: string) {
    return new Date(value).toLocaleString(this.localeName(), {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private localeName() {
    return this.i18n.locale() === "zh" ? "zh-CN" : this.i18n.locale();
  }

  nextAction(
    vm: DashboardStats & {
      newMeetings: number;
      activeLinks: number;
      hasAvailability: boolean;
    },
  ): {
    title: string;
    description: string;
    link: string;
    label: string;
  } | null {
    if (vm.newMeetings > 0) {
      return {
        title: "dashboard.next.open_new.title",
        description: "dashboard.next.open_new.description",
        link: "/meetings",
        label: "dashboard.next.open_new.label",
      };
    }

    if (!vm.hasAvailability) {
      return {
        title: "dashboard.next.availability.title",
        description: "dashboard.next.availability.description",
        link: "/availability",
        label: "dashboard.next.availability.label",
      };
    }

    if (vm.activeLinks === 0) {
      return {
        title: "dashboard.next.link.title",
        description: "dashboard.next.link.description",
        link: "/groups",
        label: "dashboard.next.link.label",
      };
    }

    return null;
  }

  quickActions(
    vm: DashboardStats & {
      newMeetings: number;
      activeLinks: number;
      hasAvailability: boolean;
    },
  ): DashboardActionItem[] {
    const primaryAction = this.nextAction(vm);
    const actions: DashboardActionItem[] = [
      {
        label: "dashboard.action.availability.label",
        description: "dashboard.action.availability.description",
        icon: "calendar",
        route: "/availability",
      },
      {
        label: "dashboard.action.book.label",
        description: "dashboard.action.book.description",
        icon: "clock",
        route: "/book",
      },
      {
        label: "dashboard.action.groups.label",
        description: "dashboard.action.groups.description",
        icon: "users",
        route: "/groups",
      },
    ];

    if (primaryAction?.link === "/book") {
      return actions.filter((action) => action.route !== "/book");
    }

    return actions;
  }
}
