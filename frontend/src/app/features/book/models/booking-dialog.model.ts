export type BookingDialogMode = "meeting" | "public-link";

export interface BookingDialogData {
  mode: BookingDialogMode;
  dateLabel: string;
  start?: string;
  end?: string;
  durationLabel?: string;
  defaultDurationMinutes?: number;
  groupName: string;
  participantsLabel: string;
  defaultTitle: string;
  defaultDescription: string;
}

export interface BookingDialogResult {
  title: string;
  description?: string;
  durationMinutes?: number;
}
