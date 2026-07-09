ALTER TABLE `users`
  DROP COLUMN `googleCalendarConnected`,
  DROP COLUMN `yandexCalendarConnected`;

ALTER TABLE `meetings`
  DROP COLUMN `googleCalendarEventId`,
  DROP COLUMN `yandexCalendarEventId`;

DROP TABLE IF EXISTS `calendar_integrations`;
