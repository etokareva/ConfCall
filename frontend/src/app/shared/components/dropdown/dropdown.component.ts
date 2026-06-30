import {
  Component,
  ElementRef,
  HostListener,
  Input,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipDirective } from "../tooltip/tooltip.directive";

@Component({
  selector: "ccs-dropdown",
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: "./dropdown.component.html",
  styleUrl: "./dropdown.component.scss",
})
export class DropdownComponent {
  private static nextId = 0;

  @Input() ariaLabel = "";
  @Input() tooltip = "";
  @Input() align: "start" | "end" = "end";

  readonly menuId = `ccs-dropdown-menu-${DropdownComponent.nextId++}`;
  readonly isOpen = signal(false);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  toggle() {
    this.isOpen.update((isOpen) => !isOpen);
  }

  close() {
    this.isOpen.set(false);
  }

  @HostListener("document:pointerdown", ["$event"])
  onDocumentPointerDown(event: PointerEvent) {
    if (!this.isOpen()) return;

    const target = event.target;
    if (
      target instanceof Node &&
      this.elementRef.nativeElement.contains(target)
    ) {
      return;
    }

    this.close();
  }

  @HostListener("keydown.escape")
  onEscape() {
    this.close();
  }

  @HostListener("focusout", ["$event"])
  onFocusOut(event: FocusEvent) {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      this.elementRef.nativeElement.contains(nextTarget)
    ) {
      return;
    }

    this.close();
  }
}
