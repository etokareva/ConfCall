import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserWithAvailability } from "../../../../core/models/api.model";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { SelectableCardGridComponent } from "../../../../shared/components/selectable-card-grid/selectable-card-grid.component";
import { SelectableCardItem } from "../../../../shared/models/selectable-card.model";

@Component({
  selector: "ccs-user-select",
  standalone: true,
  imports: [CommonModule, TranslatePipe, SelectableCardGridComponent],
  templateUrl: "./user-select.component.html",
  styleUrl: "./user-select.component.scss",
})
export class UserSelectComponent {
  @Input() users: UserWithAvailability[] = [];
  @Input() selectedIds: number[] = [];
  @Output() toggle = new EventEmitter<number>();

  userItems(): SelectableCardItem[] {
    return this.users.map(({ id, name, email, avatar }) => ({
      id,
      title: name || email || "",
      subtitle: email || undefined,
      avatar,
      fallbackText: name || email || "?",
    }));
  }
}
