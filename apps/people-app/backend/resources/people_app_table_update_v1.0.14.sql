ALTER TABLE `employee`
    ADD COLUMN `resignation_date`     DATE NULL AFTER `agreement_end_date`,
    ADD COLUMN `final_working_date`   DATE NULL AFTER `resignation_date`,
    ADD COLUMN `final_employment_date` DATE NULL AFTER `final_working_date`;
