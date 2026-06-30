import {
  ChangeDetectorRef,
  DestroyRef,
  Pipe,
  PipeTransform,
  inject,
} from "@angular/core";
import { effect } from "@angular/core";
import { I18nService } from "./i18n.service";

@Pipe({
  name: "t",
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const ref = effect(() => {
      this.i18n.locale();
      this.cdr.markForCheck();
    });
    this.destroyRef.onDestroy(() => ref.destroy());
  }

  transform(
    value: string | null | undefined,
    params?: Record<string, string | number>,
  ) {
    return this.i18n.translate(value, params);
  }
}
