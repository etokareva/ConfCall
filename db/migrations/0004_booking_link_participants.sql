CREATE TABLE booking_link_participants (
  id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  bookingLinkId bigint unsigned NOT NULL,
  userId bigint unsigned NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
