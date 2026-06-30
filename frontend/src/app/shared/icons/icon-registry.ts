export interface IconConfig {
  path: string;
  strokeWidth?: string;
}

export const ICONS = {
  alert: { path: "/assets/icons/alert.svg", strokeWidth: "2.2" },
  calendar: { path: "/assets/icons/calendar.svg" },
  check: { path: "/assets/icons/check.svg", strokeWidth: "2.2" },
  "chevron-left": {
    path: "/assets/icons/chevron-left.svg",
    strokeWidth: "2.4",
  },
  "chevron-down": {
    path: "/assets/icons/chevron-down.svg",
    strokeWidth: "2.4",
  },
  "chevron-right": {
    path: "/assets/icons/chevron-right.svg",
    strokeWidth: "2.4",
  },
  clock: { path: "/assets/icons/clock.svg" },
  copy: { path: "/assets/icons/copy.svg" },
  edit: { path: "/assets/icons/edit.svg" },
  "external-link": { path: "/assets/icons/external-link.svg" },
  handshake: { path: "/assets/icons/handshake.svg" },
  home: { path: "/assets/icons/home.svg" },
  info: { path: "/assets/icons/info.svg", strokeWidth: "2.2" },
  link: { path: "/assets/icons/link.svg" },
  "log-out": { path: "/assets/icons/log-out.svg" },
  settings: { path: "/assets/icons/settings.svg" },
  power: { path: "/assets/icons/power.svg" },
  send: { path: "/assets/icons/send.svg" },
  trash: { path: "/assets/icons/trash.svg" },
  user: { path: "/assets/icons/user.svg" },
  users: { path: "/assets/icons/users.svg" },
  video: { path: "/assets/icons/video.svg" },
} as const satisfies Record<string, IconConfig>;

export type IconName = keyof typeof ICONS;
