import {
  AvailableRange,
  AvailableSlot,
} from "../../../core/models/api.model";

export type BookStepId = "group" | "participants" | "params";
export type BookDateMode = "single" | "range";
export type BookingMode = "internal" | "public";

export interface BookStep {
  id: BookStepId;
  title: string;
  description: string;
}

export interface DayIntersection {
  date: string;
  availableSlots: AvailableSlot[];
  availableRanges: AvailableRange[];
  messageKey: string | null;
  unavailableUserIds?: number[];
}

