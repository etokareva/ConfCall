export interface BookingDialogData {
  dateLabel: string;
  start: string;
  end: string;
  durationLabel: string;
  groupName: string;
  participantsLabel: string;
  defaultTitle: string;
  defaultDescription: string;
}

export interface BookingDialogResult {
  title: string;
  description: string;
}
