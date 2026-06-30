import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRouteSnapshot, NavigationEnd, Router } from "@angular/router";
import { filter, tap } from "rxjs";
import { I18nService } from "../i18n/i18n.service";

@Injectable({ providedIn: "root" })
export class DocumentTitleService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly titleKey = signal(
    this.findTitleKey(this.router.routerState.snapshot.root),
  );
  private readonly pageTitle = computed(() => {
    const page = this.i18n.translate(this.titleKey());
    const app = this.i18n.translate("app.name");

    return page ? `${page} | ${app}` : app;
  });

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        tap(() => {
          this.titleKey.set(
            this.findTitleKey(this.router.routerState.snapshot.root),
          );
        }),
      )
      .subscribe();

    effect(() => {
      this.title.setTitle(this.pageTitle());
    });
  }

  private findTitleKey(route: ActivatedRouteSnapshot): string {
    let current: ActivatedRouteSnapshot | null = route;
    let titleKey = "route.dashboard.title";

    while (current) {
      const routeTitle = current.data["titleKey"];
      if (typeof routeTitle === "string") {
        titleKey = routeTitle;
      }
      current = current.firstChild ?? null;
    }

    return titleKey;
  }
}
