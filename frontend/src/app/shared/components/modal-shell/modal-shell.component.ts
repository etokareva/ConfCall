import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { A11yModule } from "@angular/cdk/a11y";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

let modalShellId = 0;

@Component({
  selector: "ccs-modal-shell",
  standalone: true,
  imports: [A11yModule, CommonModule, TranslatePipe],
  templateUrl: "./modal-shell.component.html",
  styleUrl: "./modal-shell.component.scss",
})
export class ModalShellComponent {
  @Input() eyebrow = "";
  @Input({ required: true }) title = "";
  @Input() subtitle = "";
  @Input() titleId = `modal-shell-title-${++modalShellId}`;
  @Input() describedBy = "";
  @Input() closeLabel = "common.close";
  @Input() showClose = true;
  @Output() readonly close = new EventEmitter<void>();
}
