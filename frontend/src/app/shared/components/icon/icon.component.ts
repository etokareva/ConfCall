import { Component, Input, inject, signal } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { HttpClient } from "@angular/common/http";
import { EMPTY } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { ICONS, IconConfig, IconName } from "../../icons/icon-registry";

interface LoadedIcon {
  content: SafeHtml;
  viewBox: string;
  strokeWidth: string;
}

const DEFAULT_VIEW_BOX = "0 0 24 24";
const DEFAULT_STROKE_WIDTH = "2";
const ICON_CACHE = new Map<string, LoadedIcon>();

@Component({
  selector: "svg-icon",
  standalone: true,
  template: `
    @if (icon(); as loadedIcon) {
      <svg
        xmlns="http://www.w3.org/2000/svg"
        [attr.viewBox]="loadedIcon.viewBox"
        fill="none"
        stroke="currentColor"
        [attr.stroke-width]="loadedIcon.strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <svg:g [innerHTML]="loadedIcon.content"></svg:g>
      </svg>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.5em;
        height: 1.5em;
        flex: 0 0 auto;
        line-height: 0;
        vertical-align: middle;
      }

      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class IconComponent {
  readonly icon = signal<LoadedIcon | null>(null);

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) set name(value: IconName | string) {
    this.loadIcon(value);
  }

  private loadIcon(name: IconName | string) {
    const config = this.iconConfig(name);
    if (!config) {
      this.icon.set(null);
      return;
    }
    const cached = ICON_CACHE.get(config.path);

    if (cached) {
      this.icon.set(cached);
      return;
    }

    this.http
      .get(config.path, { responseType: "text" })
      .pipe(
        tap((content) => {
          const loadedIcon = this.parseSvg(content, config.strokeWidth);
          ICON_CACHE.set(config.path, loadedIcon);
          this.icon.set(loadedIcon);
        }),
        catchError(() => {
          this.icon.set(null);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private parseSvg(
    svg: string,
    strokeWidth = DEFAULT_STROKE_WIDTH,
  ): LoadedIcon {
    const viewBox =
      /viewBox="([^"]+)"/.exec(svg)?.[1] ??
      /viewbox="([^"]+)"/i.exec(svg)?.[1] ??
      DEFAULT_VIEW_BOX;
    const content = svg
      .replace(/<svg\b[^>]*>/i, "")
      .replace(/<\/svg>/i, "")
      .trim();

    return {
      content: this.sanitizer.bypassSecurityTrustHtml(content),
      viewBox,
      strokeWidth,
    };
  }

  private iconConfig(name: IconName | string): IconConfig | null {
    return name in ICONS ? ICONS[name as IconName] : null;
  }
}
