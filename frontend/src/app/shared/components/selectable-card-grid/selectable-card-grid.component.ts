import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { SelectableCardItem } from "../../models/selectable-card.model";

@Component({
  selector: "ccs-selectable-card-grid",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./selectable-card-grid.component.html",
  styleUrl: "./selectable-card-grid.component.scss",
})
export class SelectableCardGridComponent {
  @Input() items: SelectableCardItem[] = [];
  @Input() selectedIds: number[] = [];
  @Input() selectionMode: "single" | "multi" = "multi";
  @Input() ariaLabel = "";
  @Input() selectLabel = "";
  @Input() selectedLabel = "";
  @Output() readonly toggle = new EventEmitter<number>();
  readonly avatarLoadFailedIds = signal<number[]>([]);

  isSelected(id: number) {
    return this.selectedIds.includes(id);
  }

  onToggle(id: number) {
    this.toggle.emit(id);
  }

  showAvatar(item: SelectableCardItem) {
    return (
      Boolean(item.avatar?.trim()) &&
      !this.avatarLoadFailedIds().includes(item.id)
    );
  }

  onAvatarLoadError(itemId: number) {
    this.avatarLoadFailedIds.update((ids) =>
      ids.includes(itemId) ? ids : [...ids, itemId],
    );
  }

  fallback(item: SelectableCardItem) {
    return (item.fallbackText || item.title || "?")[0].toUpperCase();
  }

  labelFor(item: SelectableCardItem) {
    const prefix = this.isSelected(item.id)
      ? this.selectedLabel
      : this.selectLabel;
    return [prefix, item.title].filter(Boolean).join(": ");
  }

  groupRole() {
    return this.selectionMode === "single" ? "radiogroup" : "group";
  }

  itemRole() {
    return this.selectionMode === "single" ? "radio" : null;
  }

  ariaChecked(id: number) {
    return this.selectionMode === "single" ? this.isSelected(id) : null;
  }

  ariaPressed(id: number) {
    return this.selectionMode === "multi" ? this.isSelected(id) : null;
  }
}
