export interface ModalDialogAction {
  value: string;
  label: string;
  kind?: "primary" | "secondary" | "danger";
}

export interface ModalDialogData {
  kind: "info" | "error" | "confirm";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  actions?: ModalDialogAction[];
}
