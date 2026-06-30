export interface User {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  locale: AppLocale;
  role: "user" | "admin";
  emailVerifiedAt?: string | null;
}

export type AppLocale = "ru" | "en" | "es" | "zh";

export type UserSummary = Pick<User, "id" | "name" | "email" | "avatar">;

export interface GroupInvitation {
  id: number;
  groupId: number;
  invitedByUserId: number;
  email: string;
  token: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  invitedUserId: number | null;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  groupName?: string;
}

export interface InviteGroupMembersResponse {
  invitations: GroupInvitation[];
  failedEmails: string[];
}

export type InviteGroupMembersResult =
  | InviteGroupMembersResponse
  | GroupInvitation[];

export type GroupRole = "owner" | "member";

export interface GroupMember extends UserSummary {
  role: GroupRole;
}

export interface UserGroup {
  id: number;
  name: string;
  avatar: string | null;
  createdByUserId: number;
  createdAt: string;
  role: GroupRole;
  members: GroupMember[];
}

export interface AvailabilitySlot {
  id: number;
  userId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityCalendarEvent {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  repeatEveryDays: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Meeting {
  id: number;
  organizerId: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  videoUrl: string | null;
  videoPlatform: string;
  status: "scheduled" | "completed" | "cancelled";
  cancelledAt?: string | null;
  cancelledByEmail?: string | null;
  cancelledByName?: string | null;
  isNew?: boolean;
  participants: MeetingParticipant[];
}

export interface MeetingParticipant {
  userId?: number | null;
  email: string;
  name: string | null;
  cancelToken?: string | null;
  status: "pending" | "confirmed" | "declined";
  seenAt?: string | null;
}

export interface BookingLink {
  id: number;
  groupId: number | null;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  isActive: boolean;
  createdAt?: string;
}

export interface BookingLinkContext {
  link: BookingLink;
  host: UserSummary;
  group: {
    id: number;
    name: string;
    avatar: string | null;
    members: UserSummary[];
  } | null;
}

export interface AvailableSlot {
  start: string;
  end: string;
  sources?: AvailabilityRangeSource[];
}

export interface AvailableRange extends AvailableSlot {
  durationMinutes: number;
}

export interface AvailabilityRangeSource {
  userId: number;
  sourceType: "weekly" | "calendar";
  sourceId?: number;
  startDate?: string;
  endDate?: string;
  repeatEveryDays?: number;
}

export interface AvailabilityIntersectionResult {
  availableSlots: AvailableSlot[];
  availableRanges: AvailableRange[];
  messageKey: string | null;
  unavailableUserIds?: number[];
}

export interface DayAvailabilityIntersectionResult extends AvailabilityIntersectionResult {
  date: string;
}

export interface AvailabilityRangeIntersectionResult {
  days: DayAvailabilityIntersectionResult[];
  messageKey: string | null;
}

export interface UserWithAvailability {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  slots: AvailabilitySlot[];
}

export interface CreateSlotPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateAvailabilityCalendarEventPayload {
  startDate: string;
  endDate: string;
  repeatEveryDays: number;
  startTime: string;
  endTime: string;
}

export interface RegisterWithInviteResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  verificationRequired: true;
  email: string;
}

export interface ResendVerificationResponse {
  verificationRequired: true;
  email: string;
}

export interface VerifyEmailResponse {
  token: string;
  user: User;
}

export interface LoginWithPasswordResponse {
  token: string;
  user: User;
}

export interface RequestPasswordResetResponse {
  resetRequired: true;
  email: string;
}

export interface ResetPasswordResponse {
  token: string;
  user: User;
}
