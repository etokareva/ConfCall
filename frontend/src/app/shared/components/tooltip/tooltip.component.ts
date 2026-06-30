import { Component, input } from "@angular/core";

@Component({
  selector: "ccs-tooltip",
  standalone: true,
  templateUrl: "./tooltip.component.html",
  styleUrl: "./tooltip.component.scss",
})
export class TooltipComponent {
  readonly message = input.required<string>();
}
