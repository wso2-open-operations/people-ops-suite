-- Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
--
-- WSO2 LLC. licenses this file to you under the Apache License,
-- Version 2.0 (the "License"); you may not use this file except
-- in compliance with the License.
-- You may obtain a copy of the License at
--
-- http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.

-- Data-repair script (NOT a schema migration) for employees whose
-- house_id was incorrectly nulled by the updateEmployeeJobInfoQuery
-- absence-treated-as-clear bug: any job-info edit that didn't touch
-- the House field caused house_id to be wiped to NULL, regardless of
-- what was actually being edited.

-- The fix. Only touches rows where house_id IS NULL — never
-- overwrites an already-set (and therefore presumably correct) value.
-- Replace 'REPLACE_WITH_YOUR_EMAIL' with the identity running this fix
-- (updated_by is NOT NULL on this table).
UPDATE employee
SET house_id = (CAST(REGEXP_REPLACE(employee_id, '^[^0-9]*', '') AS UNSIGNED) % 4) + 1
WHERE house_id IS NULL;


