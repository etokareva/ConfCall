import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { IconComponent } from "../../../../shared/components/icon/icon.component";
import { TooltipDirective } from "../../../../shared/components/tooltip/tooltip.directive";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { I18nService } from "../../../../core/i18n/i18n.service";
import {
  MonthCell,
  MonthCellItem,
  WeekdayOption,
} from "../../models/availability-calendar.model";

@Component({
  selector: "ccs-availability-month-grid",
  standalone: true,
  imports: [CommonModule, IconComponent, TooltipDirective, TranslatePipe],
  templateUrl: "./availability-month-grid.component.html",
  styleUrl: "./availability-month-grid.component.scss",
})
export class AvailabilityMonthGridComponent {
  @Input({ required: true }) weekdays: WeekdayOption[] = [];
  @Input({ required: true }) monthCells: MonthCell[] = [];
  @Input({ required: true }) focusedDateKey = "";

  @Output() readonly dayOpen = new EventEmitter<Date>();
  @Output() readonly dayAdd = new EventEmitter<Date>();
  @Output() readonly dateFocus = new EventEmitter<string>();
  @Output() readonly dateKeydown = new EventEmitter<{
    event: KeyboardEvent;
    cell: MonthCell;
  }>();
  @Output() readonly itemOpen = new EventEmitter<{
    item: MonthCellItem;
    date: Date;
    event?: Event;
  }>();

  private readonly i18n = inject(I18nService);

  isFocusedDate(dateKey: string) {
    return this.focusedDateKey === dateKey;
  }

  formatShortDate(date: Date) {
    return new Intl.DateTimeFormat(this.localeName(), {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  countLabel(value: number) {
    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return this.i18n.translate("common.item.one");
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return this.i18n.translate("common.item.few");
    }
    return this.i18n.translate("common.item.many");
  }

  openDay(date: Date, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dayOpen.emit(date);
  }

  addDay(date: Date, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dayAdd.emit(date);
  }

  openItem(item: MonthCellItem, date: Date, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.itemOpen.emit({ item, date, event });
  }

  private localeName() {
    return this.i18n.locale() === "zh" ? "zh-CN" : this.i18n.locale();
  }
}
