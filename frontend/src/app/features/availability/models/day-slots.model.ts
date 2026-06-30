import { CreateSlotPayload } from "../../../core/models/api.model";

export interface DaySlotsChangeEvent {
  dayIndex: number;
  slots: CreateSlotPayload[];
}
