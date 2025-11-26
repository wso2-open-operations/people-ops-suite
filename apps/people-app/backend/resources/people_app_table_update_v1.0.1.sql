ALTER TABLE personal_info
ADD COLUMN emergency_contacts JSON;

ALTER TABLE `personal_info`
MODIFY COLUMN `emergency_contacts` JSON NOT NULL;
