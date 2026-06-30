import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  inject,
} from "@angular/core";
import {
  ConnectedPosition,
  Overlay,
  OverlayRef,
  PositionStrategy,
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { TooltipComponent } from "./tooltip.component";

const TOOLTIP_POSITIONS: ConnectedPosition[] = [
  {
    originX: "center",
    originY: "top",
    overlayX: "center",
    overlayY: "bottom",
    offsetY: -8,
  },
  {
    originX: "center",
    originY: "bottom",
    overlayX: "center",
    overlayY: "top",
    offsetY: 8,
  },
  {
    originX: "end",
    originY: "center",
    overlayX: "start",
    overlayY: "center",
    offsetX: 8,
  },
  {
    originX: "start",
    originY: "center",
    overlayX: "end",
    overlayY: "center",
    offsetX: -8,
  },
];

@Directive({
  selector: "[ccsTooltip]",
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input("ccsTooltip") message = "";
  @Input() ccsTooltipDisabled = false;

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private overlayRef?: OverlayRef;

  @HostListener("mouseenter")
  @HostListener("focusin")
  show() {
    if (this.ccsTooltipDisabled || !this.message.trim()) return;

    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({
        positionStrategy: this.createPositionStrategy(),
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        hasBackdrop: false,
        panelClass: "app-tooltip-overlay",
      });
    }

    if (this.overlayRef.hasAttached()) {
      return;
    }

    const componentRef = this.overlayRef.attach(
      new ComponentPortal(TooltipComponent),
    );
    componentRef.setInput("message", this.message);
  }

  @HostListener("mouseleave")
  @HostListener("focusout")
  hide() {
    this.overlayRef?.detach();
  }

  @HostListener("keydown.escape")
  onEscape() {
    this.hide();
  }

  ngOnDestroy() {
    this.overlayRef?.dispose();
  }

  private createPositionStrategy(): PositionStrategy {
    return this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(TOOLTIP_POSITIONS)
      .withPush(true);
  }
}
