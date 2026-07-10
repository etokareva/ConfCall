export type GroupDialogMode = "create" | "edit" | "invite";

export interface GroupDialogData {
  mode: GroupDialogMode;
  groupName?: string;
  avatar?: string | null;
}

export interface GroupProfileDialogResult {
  mode: "create" | "edit";
  name: string;
  avatar: string;
}

export interface GroupInviteDialogResult {
  mode: "invite";
  emails: string;
}

export type GroupDialogResult =
  | GroupProfileDialogResult
  | GroupInviteDialogResult;
