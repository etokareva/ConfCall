CREATE INDEX `availability_slots_user_day_active_idx` ON `availability_slots` (`userId`, `dayOfWeek`, `isActive`);
--> statement-breakpoint
CREATE INDEX `availability_calendar_events_user_dates_active_idx` ON `availability_calendar_events` (`userId`, `startDate`, `endDate`, `isActive`);
--> statement-breakpoint
CREATE INDEX `group_members_group_user_idx` ON `group_members` (`groupId`, `userId`);
--> statement-breakpoint
CREATE INDEX `group_members_user_group_idx` ON `group_members` (`userId`, `groupId`);
--> statement-breakpoint
CREATE INDEX `meetings_status_time_idx` ON `meetings` (`status`, `startTime`, `endTime`);
--> statement-breakpoint
CREATE INDEX `meetings_organizer_status_time_idx` ON `meetings` (`organizerId`, `status`, `startTime`, `endTime`);
--> statement-breakpoint
CREATE INDEX `meeting_participants_meeting_user_status_idx` ON `meeting_participants` (`meetingId`, `userId`, `status`);
--> statement-breakpoint
CREATE INDEX `meeting_participants_user_status_meeting_idx` ON `meeting_participants` (`userId`, `status`, `meetingId`);
