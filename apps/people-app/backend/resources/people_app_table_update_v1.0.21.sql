-- =====================================================================
-- people_app_table_update_v1.0.21.sql
-- Fix: prevent a single employee from holding more than one active
--      (PENDING or CONFIRMED) parking reservation per booking date.
--
-- Until now uniqueness was enforced per slot only (uk_active_slot_booking_date,
-- v1.0.11). Nothing stopped one employee from booking multiple slots on the
-- same day, so a retry after a spurious "booking failed" error created a second
-- paid reservation and charged the wallet twice.
--
-- This functional unique index mirrors uk_active_slot_booking_date but is keyed
-- on the employee instead of the slot. EXPIRED rows map to NULL so they are
-- ignored by the index, allowing a fresh booking once a prior attempt expires.
--
-- Pre-cleanup: because this bug allowed multiple active reservations per
-- employee/date, production may already hold such duplicates (the reported
-- incident is one). CREATE UNIQUE INDEX would fail (error 1062) on them, so
-- first expire all-but-one active row per (employee_email, booking_date),
-- keeping the CONFIRMED row when present, otherwise the most recent id. The
-- derived table is materialized, so updating parking_reservation while reading
-- it in the subquery does not hit MySQL error 1093.
-- =====================================================================

UPDATE `parking_reservation`
SET `status` = 'EXPIRED'
WHERE `status` IN ('PENDING', 'CONFIRMED')
  AND `id` NOT IN (
    SELECT `keep_id` FROM (
        SELECT `id` AS `keep_id`,
               ROW_NUMBER() OVER (
                   PARTITION BY `employee_email`, `booking_date`
                   ORDER BY (`status` = 'CONFIRMED') DESC, `id` DESC
               ) AS `rn`
        FROM `parking_reservation`
        WHERE `status` IN ('PENDING', 'CONFIRMED')
    ) `ranked`
    WHERE `rn` = 1
  );

CREATE UNIQUE INDEX `uk_active_employee_booking_date` ON `parking_reservation` ((
    CASE
        WHEN status IN ('PENDING', 'CONFIRMED')
            THEN CONCAT(employee_email, '|', booking_date)
        ELSE NULL
    END
));
