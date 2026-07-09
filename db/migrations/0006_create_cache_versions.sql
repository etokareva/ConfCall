CREATE TABLE `cache_versions` (
	`name` varchar(128) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cache_versions_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
INSERT INTO `cache_versions` (`name`, `version`) VALUES ('intersection', 1);
