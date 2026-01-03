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
  AppConfigResponse,
  ApprovalRequest,
  ApprovalResponse,
  ApprovalStatusRequest,
  ApprovalStatusResponse,
  DayType,
  DefaultMail,
  DefaultMailResponse,
  EligibilityResponse,
  Employee,
  LeadReportRequest,
  LeadReportResponse,
  LeaveHistoryQueryParam,
  LeaveHistoryResponse,
  LeaveSubmissionRequest,
  LeaveSubmissionResponse,
  LeaveValidationRequest,
  LeaveValidationResponse,
  SabbaticalApplicationRequest,
  SabbaticalApplicationResponse,
} from "@root/src/types/types";
import { APIService } from "@root/src/utils/apiService";

/**
 * Validate leave request dates and return working days calculation.
 * @param request - Leave validation request payload
 * @returns Promise with validation response including working days
 */
export const validateLeaveRequest = async (
  request: LeaveValidationRequest,
  isValidationOnlyMode: boolean,
): Promise<LeaveValidationResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<LeaveValidationResponse>(
    `${AppConfig.serviceUrls.leaves}?isValidationOnlyMode=${isValidationOnlyMode}`,
    request,
  );

  return response.data;
};

/**
 * Fetch all employees from the backend.
 * @returns Promise with array of employees
 */
export const fetchEmployees = async (): Promise<Employee[]> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.get<Employee[]>(AppConfig.serviceUrls.employees);

  return response.data;
};

/**
 * Fetch default mail recipients from the backend.
 * @returns Promise with array of default mails
 */
export const getDefaultMails = async (): Promise<DefaultMailResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.get<DefaultMailResponse>(AppConfig.serviceUrls.defaultMails);

  return response.data;
};

/**
 * Submit a leave request.
 * @param request - Leave submission request payload
 * @returns Promise with submission response
 */
export const submitLeaveRequest = async (
  request: LeaveSubmissionRequest,
): Promise<LeaveSubmissionResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<LeaveSubmissionResponse>(
    `${AppConfig.serviceUrls.leaves}?isValidationOnlyMode=${false}`,
    request,
  );

  return response.data;
};

/**
 * Cancel a leave request.
 */
export const cancelLeaveRequest = async (id: number) => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.delete(`${AppConfig.serviceUrls.leaves}/${id}`);

  return response.data;
};

/**
 * Get a list of leave history records.
 * @param request - Leave submission request payload
 * @returns leave history data
 */
export const getLeaveHistory = async (
  params: LeaveHistoryQueryParam,
): Promise<LeaveHistoryResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.get<LeaveHistoryResponse>(
    `${AppConfig.serviceUrls.leaves}?isActive=${params.isActive}&email=${params.email}&startDate=${params.startDate}`,
  );

  return response.data;
};

/**
 * Get a lead report.
 * @param request - request payload
 * @returns Promise with submission response
 */
export const getLeadReport = async (request: LeadReportRequest): Promise<LeadReportResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<LeadReportResponse>(
    AppConfig.serviceUrls.leadReport,
    request,
  );

  return response.data;
};

/**
 * Get leave approval status list of subordinates.
 * @param request - request payload
 * @returns Promise with approval status response
 */
export const getApprovalStatusList = async (
  request: ApprovalStatusRequest,
): Promise<ApprovalStatusResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<ApprovalStatusResponse>(
    AppConfig.serviceUrls.approvalStatusList,
    request,
  );

  return response.data;
};

/**
 * Approve or reject sabbatical leave requests.
 * @param request - request payload
 * @returns Promise with approval response
 */
export const approveLeave = async (request: ApprovalRequest): Promise<ApprovalResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<ApprovalResponse>(
    AppConfig.serviceUrls.approveSabbaticalLeave,
    request,
  );

  return response.data;
};

/**
 * Check eligibility for sabbatical leave requests.
 * @returns Promise with eligibility response
 */
export const checkEligibilityForSabbaticalLeave = async (): Promise<EligibilityResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<EligibilityResponse>(
    AppConfig.serviceUrls.validateSabbaticalLeave,
  );

  return response.data;
};

/**
 * Submit a sabbatical leave request.
 * @param request - request payload
 * @returns Promise with approval response
 */
export const submitSabbaticalLeaveRequest = async (
  request: SabbaticalApplicationRequest,
): Promise<SabbaticalApplicationResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.post<SabbaticalApplicationResponse>(
    AppConfig.serviceUrls.applySabbaticalLeave,
    request,
  );

  return response.data;
};

/**
 * Get the application configurations.
 * @returns application configuration data
 */
export const getAppConfig = async (): Promise<AppConfigResponse> => {
  const apiInstance = APIService.getInstance();

  const response = await apiInstance.get<AppConfigResponse>(AppConfig.serviceUrls.appConfig);

  return response.data;
};

/**
 * Helper function to format date for API (YYYY-MM-DD)
 * @param date - Dayjs date object
 * @returns Formatted date string
 */
export const formatDateForApi = (date: any): string => {
  return date.format("YYYY-MM-DD");
};

/**
 * Helper function to determine period type based on days count
 * @param daysCount - Number of days selected
 * @returns Period type "one" or "multiple"
 */
export const getPeriodType = (daysCount: number): DayType.ONE | DayType.MULTIPLE => {
  return daysCount === 1 ? DayType.ONE : DayType.MULTIPLE;
};
