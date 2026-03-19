ALTER TABLE `parking_reservation`
    MODIFY COLUMN `status` ENUM ('PENDING', 'CONFIRMED', 'EXPIRED') NOT NULL DEFAULT 'PENDING';

ALTER TABLE `parking_reservation`
    DROP INDEX `uk_slot_booking_date`;

ALTER TABLE `parking_reservation`
    ADD COLUMN `active_slot_date` VARCHAR(64)
    GENERATED ALWAYS AS (
        CASE
            WHEN status IN ('PENDING', 'CONFIRMED')
                THEN CONCAT(slot_id, '|', booking_date)
            ELSE NULL
        END
    ) STORED;

ALTER TABLE `parking_reservation`
    ADD UNIQUE INDEX `uk_active_slot_booking_date` (`active_slot_date`);
