import { CreateAvailabilityCalendarEventPayload } from "../../../core/models/api.model";

export type AvailabilityEventDialogMode = "single" | "recurring";

export interface AvailabilityEventDialogData {
  dateKey: string;
  mode?: AvailabilityEventDialogMode;
  event?: CreateAvailabilityCalendarEventPayload;
  eventIndex?: number;
  weeklySlot?: {
    dayIndex: number;
    slotIndex: number;
  };
}

export type AvailabilityEventDialogResult =
  CreateAvailabilityCalendarEventPayload;
