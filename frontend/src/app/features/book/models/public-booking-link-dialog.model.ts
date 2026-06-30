export interface PublicBookingLinkDialogData {
  defaultTitle: string;
  defaultDescription: string;
  defaultDurationMinutes: number;
  groupName: string;
  participantsLabel: string;
}

export interface PublicBookingLinkDialogResult {
  title: string;
  description?: string;
  durationMinutes: number;
}
