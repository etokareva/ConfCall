import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { IconComponent } from "../../../../shared/components/icon/icon.component";
import { ModalShellComponent } from "../../../../shared/components/modal-shell/modal-shell.component";
import { TooltipDirective } from "../../../../shared/components/tooltip/tooltip.directive";
import { TranslatePipe } from "../../../../core/i18n/translate.pipe";
import { I18nService } from "../../../../core/i18n/i18n.service";
import {
  MonthCell,
  MonthCellItem,
} from "../../models/availability-calendar.model";

export type AvailabilityDayDetailsResult =
  | { kind: "addSlot"; date: Date }
  | { kind: "itemOpen"; item: MonthCellItem; date: Date }
  | { kind: "itemRemove"; item: MonthCellItem }
  | { kind: "meetingOpen"; item: MonthCellItem };

@Component({
  selector: "ccs-availability-day-details",
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    ModalShellComponent,
    TooltipDirective,
    TranslatePipe,
  ],
  templateUrl: "./availability-day-details.component.html",
  styleUrl: "./availability-day-details.component.scss",
})
export class AvailabilityDayDetailsComponent {
  private readonly dialogData = inject<MonthCell | null>(DIALOG_DATA, {
    optional: true,
  });
  private readonly dialogRef = inject<
    DialogRef<AvailabilityDayDetailsResult | undefined>
  >(DialogRef, { optional: true });

  @Input({ required: true }) day: MonthCell = this.dialogData as MonthCell;

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly addSlot = new EventEmitter<Date>();
  @Output() readonly itemOpen = new EventEmitter<{
    item: MonthCellItem;
    date: Date;
    event?: Event;
  }>();
  @Output() readonly itemRemove = new EventEmitter<{
    item: MonthCellItem;
    event?: Event;
  }>();
  @Output() readonly meetingOpen = new EventEmitter<{
    item: MonthCellItem;
    event?: Event;
  }>();

  private readonly i18n = inject(I18nService);

  handleClose() {
    this.dialogRef?.close();
    this.close.emit();
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

  emitAddSlot(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef?.close({ kind: "addSlot", date: this.day.date });
    this.addSlot.emit(this.day.date);
  }

  emitItemOpen(item: MonthCellItem, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef?.close({ kind: "itemOpen", item, date: this.day.date });
    this.itemOpen.emit({ item, date: this.day.date, event });
  }

  emitItemRemove(item: MonthCellItem, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef?.close({ kind: "itemRemove", item });
    this.itemRemove.emit({ item, event });
  }

  emitMeetingOpen(item: MonthCellItem, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef?.close({ kind: "meetingOpen", item });
    this.meetingOpen.emit({ item, event });
  }

  private localeName() {
    return this.i18n.locale() === "zh" ? "zh-CN" : this.i18n.locale();
  }
}
