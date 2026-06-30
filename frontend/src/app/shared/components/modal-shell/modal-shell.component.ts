import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

@Component({
  selector: "ccs-modal-shell",
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: "./modal-shell.component.html",
  styleUrl: "./modal-shell.component.scss",
})
export class ModalShellComponent {
  @Input() eyebrow = "";
  @Input({ required: true }) title = "";
  @Input() subtitle = "";
  @Input() titleId = "";
  @Input() closeLabel = "common.close";
  @Input() showClose = true;
  @Output() readonly close = new EventEmitter<void>();
}
