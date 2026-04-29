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
import { BasicUserInfo, DecodedIDTokenPayload } from "@asgardeo/auth-spa";

import { Collection } from "@slices/collections/collection";

export interface Employee {
  workEmail: string;
  firstName: string;
  lastName: string;
  jobBand: number;
  employeeThumbnail: string;
}

export interface Header {
  title: string;
  size: number;
  align: "left" | "right" | "center";
}

export interface ParConfigurations {
  employeeParQuestion: string;
  threeSixtyReviewQuestion: string;
  parRatings: string[];
  threeSixtyReviewRatings: string[];
}

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
}

export interface PreLoaderProps {
  message?: string;
  hideLogo?: boolean;
  isLoading?: boolean;
}

export interface ErrorHandlerProps {
  message: string | null;
}

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

export enum RequestState {
  IDLE = "idle",
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

export interface CommonCardProps {
  collection: Collection;
  actions: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  dataCardIndex: number;
}

export interface GroupedTeams {
  id: number;
  teams: SpecialQuotaTeam[];
  default5Slots: number;
  default20Slots: number;
  allocated5Slots: number;
  allocated20Slots: number;
  totalHeadCount: number;
  name: string;
  allocatedLeads: string[];
}

export interface SpecialQuotaTeam {
  parCycleId: number;
  specialRatingGroupId: number;
  businessUnit: string;
  department: string;
  team: string;
  headCount: number | null;
  groupNumber: number | null;
  specialRatingQuotaId: number | null;
}

export enum Role {
  EMPLOYEE = "EMPLOYEE",
  ADMIN = "ADMIN",
  LEAD = "LEAD",
  TEAM_LEAD = "TEAM_LEAD",
}

export interface AuthState {
  status: RequestState;
  statusMessage: string | null;
  mode: "active" | "maintenance";
  isAuthenticated: boolean;
  userInfo: BasicUserInfo | null;
  accessToken: string | null;
  isIdTokenExpired: boolean | null;
  decodedIdToken: DecodedIDTokenPayload | null;
  roles: Role[];
  userPrivileges: number[] | null;
  errorMessage: string | null;
  authFlowState: AuthFlowState;
  userEmail?: string | null;
  employeeInfoStatus: RequestState;
  employeeInfo?: EmployeeInfo | null;
}

export interface AuthData {
  userInfo: BasicUserInfo;
  accessToken: string;
  decodedIdToken: DecodedIDTokenPayload;
}

export type AuthFlowState = "start" | "l_user_privileges" | "e_user_privileges" | "end";

export interface EmployeeInfo {
  employeeName: string;
  employeeThumbnail: string;
  workEmail: string;
  startDate: string;
  jobRole: string;
  businessUnit: string;
  department: string;
  team?: string;
  location: string;
  isTeamLead: boolean;
  leadEmail: string | null;
  lead: boolean | null;
}

export enum ParCycleStatus {
  PENDING = "PENDING",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  PENDING_QUOTA = "PENDING_QUOTA",
}
