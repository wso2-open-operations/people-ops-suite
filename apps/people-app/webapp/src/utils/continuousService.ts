// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import dayjs from "dayjs";
import { EmployeeStatus } from "@/types/types";
import { ContinuousServiceRecordInfo } from "@slices/employeeSlice/employee";

/**
 * Whether a prior record can be offered as the employment another one continues from.
 *
 * Mirrors the backend's isEligiblePriorEmployment, which is the real guard: the record
 * must have ended (Left), must have started before the employment being linked, and must
 * not be that employment itself. The start-date rule is what stops a record being linked
 * forwards, or two records being linked in a cycle.
 *
 * @param record Candidate from the continuous-service-records lookup
 * @param startDate Start date of the employment being linked; when it is not known yet,
 *   only the status and self checks apply and the backend checks the date on save
 * @param employeeId Employee ID of the employment being linked, if it already exists
 */
export const isEligiblePriorEmployment = (
  record: ContinuousServiceRecordInfo,
  startDate: string | null | undefined,
  employeeId?: string | null,
): boolean => {
  if (record.employeeStatus !== EmployeeStatus.Left) return false;
  if (employeeId && record.employeeId === employeeId) return false;
  if (!startDate || !dayjs(startDate).isValid()) return true;
  return dayjs(record.startDate).isBefore(dayjs(startDate), "day");
};
