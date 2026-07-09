CREATE TABLE IF NOT EXISTS `group_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `groupId` bigint unsigned NOT NULL,
  `invitedByUserId` bigint unsigned NOT NULL,
  `email` varchar(320) NOT NULL,
  `token` varchar(64) NOT NULL,
  `status` enum('pending','accepted','cancelled','expired') NOT NULL DEFAULT 'pending',
  `invitedUserId` bigint unsigned DEFAULT NULL,
  `acceptedAt` timestamp NULL DEFAULT NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_invitations_token_unique` (`token`)
);
