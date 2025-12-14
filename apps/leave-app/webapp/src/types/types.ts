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

import type { RouteObject } from "react-router-dom";

export type NavState = {
  hovered: number | null;
  active: number | null;
  expanded: number | null;
};

export enum State {
  failed = "failed",
  success = "success",
  loading = "loading",
  idle = "idle",
}

export enum ConfirmationType {
  update = "update",
  send = "send",
  upload = "upload",
  accept = "accept",
}

export interface RouteDetail {
  path: string;
  allowRoles?: string[];
  icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
  text?: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  element?: React.ReactNode;
}


export type RouteObjectWithRole = RouteObject & {
  allowRoles?: string[];
};

// Leave validation types.
export interface LeaveValidationRequest {
  periodType: "one" | "multiple";
  startDate: string;
  endDate: string;
  isMorningLeave: boolean | null;
}

// Leave validation response type.
export interface LeaveValidationResponse {
  workingDays: number;
  isValid: boolean;
  message?: string;
}

// Employee types.
export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
}
// Default mail type.
export interface DefaultMail {
  email: string;
  thumbnail: string;
}
// Leave submission type.
export interface LeaveSubmissionRequest {
  periodType: "one" | "multiple" | "half";
  startDate: string;
  endDate: string;
  isMorningLeave: boolean | null;
  comment: string;
  leaveType: string;
  emailRecipients: string[];
  isPublicComment: boolean;
}

// Leave submission response type.
export interface LeaveSubmissionResponse {
  success: boolean;
  message?: string;
  leaveId?: string;
}

// Leave history response for a single leave.
export interface SingleLeaveHistory {
  id: string;
  email: string;
  leaveType: string;
  periodType: string;
  copyEmailList: string;
  notifyEveryone: boolean;
  submitComment: string;
  cancelComment: string;
  createdDate: string | null;
  updatedDate: string | null;
  emailId: string | null;
  emailSubject: string | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
  startHalf: number | null;
  isEndHalf: number | null;
  canceledDate: string | null;
  numberOfDays: number;
  isPublicComment: boolean;
  calendarEventId: string | null;
  location: string;
}

// Leave history response type.
export interface LeaveHistoryResponse {
  leaves: SingleLeaveHistory[];
}

// Query parameters for leave history request.
export interface LeaveHistoryQueryParam {
  isActive: boolean;
  email: string;
  startDate: string;
}

// Lead report request type.
export interface LeadReportRequest {
  startDate: string;
  endDate: string;
}

// Lead report response type.
export interface LeadReportResponse {
  [email: string]: {
    casual?: number;
    total?: number;
    totalExLieu?: number;
    lieu?: number;
    maternity?: number;
    paternity?: number;
    sabbatical?: number;
  };
}
