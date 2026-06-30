import { Component, ElementRef, inject } from "@angular/core";
import { Dialog } from "@angular/cdk/dialog";
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterOutlet,
} from "@angular/router";
import { filter, tap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DocumentTitleService } from "./core/services/document-title.service";
import { ToastService } from "./core/services/toast.service";

@Component({
  selector: "ccs-root",
  standalone: true,
  imports: [RouterOutlet],
  template: '<main id="main-content" tabindex="-1"><router-outlet /></main>',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly documentTitle = inject(DocumentTitleService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart => event instanceof NavigationStart,
        ),
        tap(() => {
          this.dialog.closeAll();
          this.toast.clear();
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        tap(() => {
          this.elementRef.nativeElement
            .querySelector<HTMLElement>("#main-content")
            ?.focus();
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
