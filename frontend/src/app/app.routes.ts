import { Routes } from "@angular/router";
import { authRequiredGuard, guestOnlyGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    data: { titleKey: "route.home.title" },
    loadComponent: () =>
      import("./features/home/pages/home.page").then((m) => m.HomePage),
  },
  {
    path: "login",
    data: { titleKey: "route.login.title" },
    canMatch: [guestOnlyGuard],
    loadComponent: () =>
      import("./features/login/pages/login/login.page").then(
        (m) => m.LoginPage,
      ),
  },
  {
    path: "invite",
    data: { titleKey: "route.invite.title" },
    loadComponent: () =>
      import("./features/login/pages/invite/invite.page").then(
        (m) => m.InvitePage,
      ),
  },
  {
    path: "verify-email",
    data: { titleKey: "route.verify_email.title" },
    loadComponent: () =>
      import("./features/login/pages/verify-email/verify-email.page").then(
        (m) => m.VerifyEmailPage,
      ),
  },
  {
    path: "reset-password",
    data: { titleKey: "route.reset_password.title" },
    loadComponent: () =>
      import("./features/login/pages/reset-password/reset-password.page").then(
        (m) => m.ResetPasswordPage,
      ),
  },
  {
    path: "dashboard",
    data: { titleKey: "route.dashboard.title" },
    canMatch: [authRequiredGuard],
    loadComponent: () =>
      import("./features/dashboard/pages/dashboard.page").then(
        (m) => m.DashboardPage,
      ),
  },
  {
    path: "availability",
    data: { titleKey: "route.availability.title" },
    canMatch: [authRequiredGuard],
    loadComponent: () =>
      import("./features/availability/pages/availability.page").then(
        (m) => m.AvailabilityPage,
      ),
  },
  {
    path: "book",
    data: { titleKey: "route.book.title" },
    canMatch: [authRequiredGuard],
    loadComponent: () =>
      import("./features/book/pages/book.page").then((m) => m.BookPage),
  },
  {
    path: "booking-links",
    data: { titleKey: "route.booking_links.title" },
    canMatch: [authRequiredGuard],
    loadComponent: () =>
      import("./features/booking-links/pages/booking-links.page").then(
        (m) => m.BookingLinksPage,
      ),
  },
  {
    path: "groups",
    data: { titleKey: "route.groups.title" },
    canMatch: [authRequiredGuard],
    loadComponent: () =>
      import("./features/settings/pages/settings.page").then(
        (m) => m.SettingsPage,
      ),
  },
  {
    path: "profile",
    data: { titleKey: "route.profile.title" },
    canMatch: [authRequiredGuard],
    loadComponent: () =>
      import("./features/settings/pages/settings.page").then(
        (m) => m.SettingsPage,
      ),
  },
  {
    path: "book/cancel/:token",
    data: { titleKey: "route.public_booking_cancel.title" },
    loadComponent: () =>
      import("./features/public-booking/pages/public-booking-cancel.page").then(
        (m) => m.PublicBookingCancelPage,
      ),
  },
  {
    path: "book/:userId",
    data: { titleKey: "route.public_booking.title" },
    loadComponent: () =>
      import("./features/public-booking/pages/public-booking.page").then(
        (m) => m.PublicBookingPage,
      ),
  },
  {
    path: "meetings",
    data: { titleKey: "route.meetings.title" },
    canMatch: [authRequiredGuard],
    loadComponent: () =>
      import("./features/meetings/pages/meetings.page").then(
        (m) => m.MeetingsPage,
      ),
  },
  {
    path: "settings",
    redirectTo: "/profile",
    pathMatch: "full",
  },
  {
    path: "access",
    redirectTo: "/groups",
    pathMatch: "full",
  },
  { path: "**", redirectTo: "/" },
];
