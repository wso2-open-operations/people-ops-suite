// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import { AppConfig } from "@root/src/config/config";
import {
  Employee,
  LeaveSubmissionRequest,
  LeaveSubmissionResponse,
  LeaveValidationRequest,
  LeaveValidationResponse,
} from "@root/src/types/types";
import { APIService } from "@root/src/utils/apiService";

/**
 * Validates leave request dates and returns working days calculation
 * @param request - Leave validation request payload
 * @returns Promise with validation response including working days
 */
export const validateLeaveRequest = async (
  request: LeaveValidationRequest,
): Promise<LeaveValidationResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<LeaveValidationResponse>(
    `${AppConfig.serviceUrls.leaves}?isValidationOnlyMode=true`,
    request,
  );

  return response.data;
};

/**
 * Fetches all employees from the backend
 * @returns Promise with array of employees
 */
export const fetchEmployees = async (): Promise<Employee[]> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.get<Employee[]>(AppConfig.serviceUrls.employees);

  return response.data;
};

/**
 * Submits a leave request
 * @param request - Leave submission request payload
 * @returns Promise with submission response
 */
export const submitLeaveRequest = async (
  request: LeaveSubmissionRequest,
): Promise<LeaveSubmissionResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<LeaveSubmissionResponse>(
    AppConfig.serviceUrls.leaves,
    request,
  );

  return response.data;
};
/**
 * Helper function to format date for API (YYYY-MM-DD)
 * @param date - Dayjs date object
 * @returns Formatted date string
 */
export const formatDateForAPI = (date: any): string => {
  return date.format("YYYY-MM-DD");
};

/**
 * Helper function to determine period type based on days count
 * @param daysCount - Number of days selected
 * @returns Period type "one" or "multiple"
 */
export const getPeriodType = (daysCount: number): "one" | "multiple" => {
  return daysCount === 1 ? "one" : "multiple";
};
