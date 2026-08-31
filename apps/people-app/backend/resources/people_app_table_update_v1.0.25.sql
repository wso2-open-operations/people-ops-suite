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

-- =====================================================================
-- people_app_table_update_v1.0.25.sql
-- Adds an `idp_groups` column (JSON) to all 4 org-hierarchy mapping
-- tables so Asgardeo/SCIM group rules can be assigned at any level:
--   business_unit
--   business_unit_team
--   business_unit_team_sub_team
--   business_unit_team_sub_team_unit
--
-- Resolution order used by the backend when onboarding an employee is
-- Unit -> Sub-Team -> Team -> Business Unit (most specific wins; falls
-- back upward when a level has no idp_groups set).
--
-- Seeds idp_groups at the TEAM level (business_unit_team) for the two
-- teams that currently need group assignment: SALES and SALES ENGINEERING.
-- Both are teams, not business units, so business_unit.idp_groups is left
-- NULL for now.
--
-- Runs against a database already at v1.0.24.
-- =====================================================================

-- Step 1: Add idp_groups column to all 4 hierarchy tables.
ALTER TABLE `business_unit`
ADD COLUMN `idp_groups` JSON NULL DEFAULT NULL AFTER `is_active`;

ALTER TABLE `business_unit_team`
ADD COLUMN `idp_groups` JSON NULL DEFAULT NULL AFTER `is_active`;

ALTER TABLE `business_unit_team_sub_team`
ADD COLUMN `idp_groups` JSON NULL DEFAULT NULL AFTER `is_active`;

ALTER TABLE `business_unit_team_sub_team_unit`
ADD COLUMN `idp_groups` JSON NULL DEFAULT NULL AFTER `is_active`;

-- Step 2: Pre-flight — run BEFORE the seed UPDATEs below.
-- `team.name` has NO uniqueness constraint in the schema: the same team
-- (e.g. "SALES") can legitimately be linked to many different business units,
-- one business_unit_team row per business unit (the only uniqueness on that
-- table is the composite (business_unit_id, team_id) from v1.0.15).
--
-- CONFIRMED INTENTIONAL: this rule is meant to apply team-wide, regardless of
-- business unit — i.e. every business unit that has a SALES team should get
-- the same idp_groups. As of this writing that's 7 business_unit_team rows
-- for SALES and 10 for SALES ENGINEERING; the UPDATEs below correctly touch
-- all matching rows in one statement, not just one. This is not a bug to
-- guard against — it's the intended behavior.
--
-- Run this first purely to see the actual affected rows before running
-- Step 2a/2b, so you know exactly what's about to change:
--
--   SELECT but.id, but.business_unit_id, but.team_id, but.is_active,
--          t.name AS team_name, bu.name AS business_unit_name
--     FROM business_unit_team but
--     JOIN team t ON t.id = but.team_id
--     JOIN business_unit bu ON bu.id = but.business_unit_id
--    WHERE t.name IN ('SALES', 'SALES ENGINEERING');

-- Step 2a: Seed SALES -> business_unit_team level (team, not business unit).
-- NOTE: confirm the exact `name` value in the `team` table before running
-- (case/spacing must match exactly, e.g. 'SALES').
-- Only touches active mappings.
UPDATE `business_unit_team` `but`
JOIN `team` `t` ON `t`.`id` = `but`.`team_id`
SET `but`.`idp_groups` = JSON_ARRAY('Sales_Group_1', 'Sales_Group_2')
WHERE `t`.`name` = 'SALES'
  AND `but`.`is_active` = 1;

-- Step 2b: Seed SALES ENGINEERING -> business_unit_team level.
-- NOTE: confirm the exact `name` value in the `team` table before running.
UPDATE `business_unit_team` `but`
JOIN `team` `t` ON `t`.`id` = `but`.`team_id`
SET `but`.`idp_groups` = JSON_ARRAY('Sales_Engineering_Group')
WHERE `t`.`name` = 'SALES ENGINEERING'
  AND `but`.`is_active` = 1;

-- Step 3: Verification queries (read-only, safe to run after the above).
-- SELECT but.id, t.name AS team_name, bu.name AS business_unit_name, but.idp_groups
--   FROM business_unit_team but
--   JOIN team t ON t.id = but.team_id
--   JOIN business_unit bu ON bu.id = but.business_unit_id
--   WHERE t.name IN ('SALES', 'SALES ENGINEERING');
