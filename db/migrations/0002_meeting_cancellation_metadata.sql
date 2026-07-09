ALTER TABLE `meetings`
  ADD COLUMN `cancelledByName` varchar(255),
  ADD COLUMN `cancelledByEmail` varchar(320),
  ADD COLUMN `cancelledAt` timestamp;

ALTER TABLE `meeting_participants`
  ADD COLUMN `cancelToken` varchar(64),
  ADD UNIQUE INDEX `meeting_participants_cancelToken_unique` (`cancelToken`);
