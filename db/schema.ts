import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  bigint,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  locale: varchar("locale", { length: 8 }).default("ru").notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  emailVerificationSentAt: timestamp("emailVerificationSentAt"),
  passwordHash: text("passwordHash"),
  passwordUpdatedAt: timestamp("passwordUpdatedAt"),
  telemostToken: text("telemostToken"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const emailVerificationTokens = mysqlTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  promoCodeId: bigint("promoCodeId", {
    mode: "number",
    unsigned: true,
  }),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationToken =
  typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken =
  typeof emailVerificationTokens.$inferInsert;

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export const cacheVersions = mysqlTable("cache_versions", {
  name: varchar("name", { length: 128 }).primaryKey(),
  version: int("version").default(1).notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CacheVersion = typeof cacheVersions.$inferSelect;
export type InsertCacheVersion = typeof cacheVersions.$inferInsert;

export const availabilitySlots = mysqlTable(
  "availability_slots",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
    startTime: varchar("startTime", { length: 5 }).notNull(), // "HH:MM" format
    endTime: varchar("endTime", { length: 5 }).notNull(), // "HH:MM" format
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userDayActiveIdx: index("availability_slots_user_day_active_idx").on(
      table.userId,
      table.dayOfWeek,
      table.isActive,
    ),
  }),
);

export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = typeof availabilitySlots.$inferInsert;

export const availabilityCalendarEvents = mysqlTable(
  "availability_calendar_events",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    startDate: varchar("startDate", { length: 10 }).notNull(), // "YYYY-MM-DD"
    endDate: varchar("endDate", { length: 10 }).notNull(), // "YYYY-MM-DD"
    repeatEveryDays: int("repeatEveryDays").default(1).notNull(),
    startTime: varchar("startTime", { length: 5 }).notNull(), // "HH:MM" format
    endTime: varchar("endTime", { length: 5 }).notNull(), // "HH:MM" format
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userDateActiveIdx: index(
      "availability_calendar_events_user_dates_active_idx",
    ).on(table.userId, table.startDate, table.endDate, table.isActive),
  }),
);

export type AvailabilityCalendarEvent =
  typeof availabilityCalendarEvents.$inferSelect;
export type InsertAvailabilityCalendarEvent =
  typeof availabilityCalendarEvents.$inferInsert;

export const groups = mysqlTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 1024 }),
  createdByUserId: bigint("createdByUserId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

export const groupMembers = mysqlTable(
  "group_members",
  {
    id: serial("id").primaryKey(),
    groupId: bigint("groupId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    groupUserIdx: index("group_members_group_user_idx").on(
      table.groupId,
      table.userId,
    ),
    userGroupIdx: index("group_members_user_group_idx").on(
      table.userId,
      table.groupId,
    ),
  }),
);

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

export const groupInvitations = mysqlTable("group_invitations", {
  id: serial("id").primaryKey(),
  groupId: bigint("groupId", { mode: "number", unsigned: true }).notNull(),
  invitedByUserId: bigint("invitedByUserId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "cancelled", "expired"])
    .default("pending")
    .notNull(),
  invitedUserId: bigint("invitedUserId", {
    mode: "number",
    unsigned: true,
  }),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type GroupInvitation = typeof groupInvitations.$inferSelect;
export type InsertGroupInvitation = typeof groupInvitations.$inferInsert;

export const meetings = mysqlTable(
  "meetings",
  {
    id: serial("id").primaryKey(),
    organizerId: bigint("organizerId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startTime: timestamp("startTime").notNull(),
    endTime: timestamp("endTime").notNull(),
    videoPlatform: mysqlEnum("videoPlatform", [
      "telemost",
      "salutejazz",
      "trueconf",
      "jitsi",
    ]).default("telemost"),
    videoUrl: text("videoUrl"),
    videoMeetingId: varchar("videoMeetingId", { length: 255 }),
    status: mysqlEnum("status", ["scheduled", "completed", "cancelled"])
      .default("scheduled")
      .notNull(),
    cancelledByName: varchar("cancelledByName", { length: 255 }),
    cancelledByEmail: varchar("cancelledByEmail", { length: 320 }),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusTimeIdx: index("meetings_status_time_idx").on(
      table.status,
      table.startTime,
      table.endTime,
    ),
    organizerStatusTimeIdx: index("meetings_organizer_status_time_idx").on(
      table.organizerId,
      table.status,
      table.startTime,
      table.endTime,
    ),
  }),
);

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

export const meetingParticipants = mysqlTable(
  "meeting_participants",
  {
    id: serial("id").primaryKey(),
    meetingId: bigint("meetingId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 255 }),
    cancelToken: varchar("cancelToken", { length: 64 }).unique(),
    status: mysqlEnum("status", ["pending", "confirmed", "declined"])
      .default("pending")
      .notNull(),
    seenAt: timestamp("seenAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    meetingUserStatusIdx: index(
      "meeting_participants_meeting_user_status_idx",
    ).on(table.meetingId, table.userId, table.status),
    userStatusMeetingIdx: index(
      "meeting_participants_user_status_meeting_idx",
    ).on(table.userId, table.status, table.meetingId),
  }),
);

export type MeetingParticipant = typeof meetingParticipants.$inferSelect;
export type InsertMeetingParticipant = typeof meetingParticipants.$inferInsert;

export const bookingLinks = mysqlTable("booking_links", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  groupId: bigint("groupId", { mode: "number", unsigned: true }),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 })
    .default("Забронировать встречу")
    .notNull(),
  description: text("description"),
  durationMinutes: int("durationMinutes").default(30).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type BookingLink = typeof bookingLinks.$inferSelect;
export type InsertBookingLink = typeof bookingLinks.$inferInsert;

export const bookingLinkParticipants = mysqlTable("booking_link_participants", {
  id: serial("id").primaryKey(),
  bookingLinkId: bigint("bookingLinkId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingLinkParticipant =
  typeof bookingLinkParticipants.$inferSelect;
export type InsertBookingLinkParticipant =
  typeof bookingLinkParticipants.$inferInsert;

export const promoCodes = mysqlTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  createdByUserId: bigint("createdByUserId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  groupId: bigint("groupId", { mode: "number", unsigned: true }),
  usedByUserId: bigint("usedByUserId", { mode: "number", unsigned: true }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;
