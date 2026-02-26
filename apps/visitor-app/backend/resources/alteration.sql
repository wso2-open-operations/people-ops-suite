-- Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).

-- WSO2 LLC. licenses this file to you under the Apache License,
-- Version 2.0 (the "License"); you may not use this file except
-- in compliance with the License.
-- You may obtain a copy of the License at

-- http://www.apache.org/licenses/LICENSE-2.0

-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License. 

ALTER TABLE `people_ops_suite`.`visitor` 
CHANGE COLUMN `email_hash` `id_hash` VARCHAR(255) NOT NULL ;

ALTER TABLE `people_ops_suite`.`visit` 
DROP FOREIGN KEY `email_hash`;
ALTER TABLE `people_ops_suite`.`visit` 
CHANGE COLUMN `email_hash` `visitor_id_hash` VARCHAR(255) NOT NULL ;
ALTER TABLE `people_ops_suite`.`visit` 
ADD CONSTRAINT `email_hash`
  FOREIGN KEY (`visitor_id_hash`)
  REFERENCES `people_ops_suite`.`visitor` (`id_hash`);

ALTER TABLE `people_ops_suite`.`visit` 
ADD COLUMN `sms_verification_code` INT(6) NULL DEFAULT NULL AFTER `invited_by`,
ADD UNIQUE INDEX `sms_verification_code_UNIQUE` (`sms_verification_code` ASC) VISIBLE;

ALTER TABLE `people_ops_suite`.`visit` 
CHANGE COLUMN `visit_date` `visit_date` CHAR(10) NOT NULL ;

ALTER TABLE `people_ops_suite`.`visit` ;
ALTER TABLE `people_ops_suite`.`visit` RENAME INDEX `email_hash_idx` TO `id_hash_idx`;
ALTER TABLE `people_ops_suite`.`visit` ALTER INDEX `id_hash_idx` VISIBLE;

ALTER TABLE `people_ops_suite`.`visitor` ;
ALTER TABLE `people_ops_suite`.`visitor` RENAME INDEX `email_hash_UNIQUE` TO `id_hash_UNIQUE`;
ALTER TABLE `people_ops_suite`.`visitor` ALTER INDEX `id_hash_UNIQUE` VISIBLE;

ALTER TABLE `people_ops_suite`.`visitor` 
CHANGE COLUMN `updated_on` `updated_on` TIMESTAMP(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);

ALTER TABLE `people_ops_suite`.`visit` 
DROP FOREIGN KEY `email_hash`;
ALTER TABLE `people_ops_suite`.`visit` 
ADD CONSTRAINT `visitor_id_hash`
  FOREIGN KEY (`visitor_id_hash`)
  REFERENCES `people_ops_suite`.`visitor` (`id_hash`);
