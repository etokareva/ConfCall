import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ToastService } from "../../../core/services/toast.service";
import { IconComponent } from "../icon/icon.component";
import { ToastKind } from "../../models/toast.model";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

@Component({
  selector: "ccs-toast-host",
  standalone: true,
  imports: [CommonModule, IconComponent, TranslatePipe],
  templateUrl: "./toast-host.component.html",
  styleUrl: "./toast-host.component.scss",
})
export class ToastHostComponent {
  toast = inject(ToastService);

  iconName(kind: ToastKind) {
    return kind === "success" ? "check" : kind === "error" ? "alert" : "info";
  }
}
