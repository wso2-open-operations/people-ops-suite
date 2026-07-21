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
-- =====================================================================

CREATE UNIQUE INDEX `uk_active_employee_booking_date` ON `parking_reservation` ((
    CASE
        WHEN status IN ('PENDING', 'CONFIRMED')
            THEN CONCAT(employee_email, '|', booking_date)
        ELSE NULL
    END
));
