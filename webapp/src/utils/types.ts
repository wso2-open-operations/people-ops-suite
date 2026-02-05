// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { BasicUserInfo, DecodedIDTokenPayload } from "@asgardeo/auth-spa";

export type AlertType =
  | "REQUEST"
  | "SUBMIT"
  | "SAVE"
  | "DECLINE"
  | "END"
  | "CREATE";

export type stateType = "failed" | "success" | "loading" | "idle";

export enum Role {
  EMPLOYEE = "EMPLOYEE",
  ADMIN = "ADMIN",
  TEAM_LEAD = "TEAM_LEAD",
}

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

export type AuthFlowState =
  | "start"
  | "l_user_privileges"
  | "e_user_privileges"
  | "end";

export interface AuthState {
  status: RequestState;
  statusMessage: string | null;
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

export interface TokenResponse {
  access_token: string;
  expires_in: Number;
  id_token: string;
  issued_token_type: string;
  scope: string;
  refresh_token: string;
  token_type: string;
}

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

export interface ParCycle {
  parCycleId: number;
  parCycleName: string;
  parCycleStartDate: string;
  parCycleEndDate: string;
  parEvaluationStartDate: string;
  parEvaluationEndDate: string;
  parEmployeeDeadline: string;
  parThreeSixtyRatingDeadline: string;
  parLeadDeadline: string;
  parSpecialRatingDeadline: string;
  parF2FDeadline: string;
  parCycleStatus: string;
  parCycleConfigurations: ParConfigurations;
}

export type ParCycleSummary = Omit<
  ParCycle,
  | "parEmployeeDeadline"
  | "parThreeSixtyRatingDeadline"
  | "parLeadDeadline"
  | "parSpecialRatingDeadline"
  | "parCycleConfigurations"
>;

export interface TeamSummary {
  employeeParCompletedCount: number;
  threeSixtyReviewCompletedCount: number;
  leadsReviewCompletedCount: number;
  f2fCompletedCount: number;
}

export interface AllTeamsSummary {
  totalEmployees: number;
  totalEmployeeParComplete: number;
  totalLeadReviewComplete: number;
  totalF2fComplete: number;
}

export interface Team {
  parTeamId: number;
  parLeadEmail: string;
  parBusinessUnit: string;
  parDepartment: string;
  parTeam: string;
  parSubTeam: string;
  numberOfTeamMembers: number;
  numberOf5pSlots: number;
  numberOf20pSlots: number;
  summary: TeamSummary;
}

export interface TeamReport {
  parCycleId: number;
  parTeamId: number;
  parBusinessUnit: string;
  parDepartment: string;
  parTeam: string;
  parSubTeam: string;
  parLeadEmail: string;
  numberOfTeamMembers: number;
  available5pSlots: number;
  available20pSlots: number;
  numberOf5pSlots: number;
  numberOf20pSlots: number;
  summary: TeamSummary;
  details: ParRatingShort[];
}

export interface ParRating {
  parRatingId: number;
  parEmployeeEmail: string;
  parEmployeeName: string;
  parEmployeeComment: string;
  parEmployeeStatus: ParEmployeeStatus;
  parF2fStatus: ParF2fStatus;
  parF2fDate: string;
  parRating?: string;
  parSpecialRating?: ParSpecialRating;
  parLeadEmail?: string;
  parLeadComment?: string;
  parLeadStatus?: ParLeadStatus;
  parAdminComment?: string;
  parTeam?: string;
  parDepartment?: string;
  parBusinessUnit?: string;
  parSubTeam?: string;
  parRatingSharedBy?: string;
  parPerformanceNoticeAck?: string;
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
  headCount: number | null;
  groupNumber: number | null;
  specialRatingQuotaId: number | null;
}

export interface PostSpecialQuotaTeam {
  parCycleId: number;
  specialRatingGroupId: number;
  businessUnit: string;
  department: string;
  specialRatingQuotaId: number;
}

export interface SpecialRatingQuota {
  specialRatingQuotaId: number;
  specialRatingQuotaName: string;
  top5pQuota: number;
  top20pQuota: number;
  allocatedLeads: string[];
}

export interface ParSpecialRatingQuotaGroups {
  parCycleId: number;
  parSpecialRatingGroups: PostSpecialQuotaTeam[];
  specialRatingQuotas: SpecialRatingQuota[];
}

export interface ParRatingShort extends Omit<ParRating, "parEmployeeComment"> {
  par360ReviewStatus: ParThreeSixtyReviewStatus;
  par360ReviewCounts?: {
    requestedReviewCount: number;
    sharedReviewCount: number;
  };
}

export interface ThreeSixtyReviewer {
  reviewerEmail: string;
  reviewStatus?: ParThreeSixtyReviewStatus;
  isLeadRequested?: boolean;
  isEmployeeRequested?: boolean;
}

export interface ThreeSixtyReviewRequest {
  employeeEmail: string;
  reviewStatus: ParThreeSixtyReviewStatus;
  isEmployeeRequested: boolean;
  isLeadRequested: boolean;
}

export interface ThreeSixtyReview {
  reviewerEmail: string;
  reviewRating: string;
  reviewComment?: string;
  reviewStatus?: ParThreeSixtyReviewStatus;
}

export enum RequestState {
  IDLE = "idle",
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

export enum ParCycleStatus {
  PENDING = "PENDING",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  PENDING_QUOTA = "PENDING_QUOTA",
}

export enum ParEmployeeStatus {
  PENDING = "PENDING",
  DRAFT = "DRAFT",
  SHARED = "SHARED",
  SHARED_BLOCKED = "SHARED_BLOCKED",
}

export enum ParThreeSixtyReviewStatus {
  PENDING = "PENDING",
  DRAFT = "DRAFT",
  COMPLETED = "SHARED",
  REJECTED = "REJECTED",
}

export enum ParLeadStatus {
  PENDING = "PENDING",
  DRAFT = "DRAFT",
  SHARED = "SHARED",
}

export enum ParF2fStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
}

export enum ParSpecialRating {
  TOP_FIVE_PERCENT = "TOP5P",
  TOP_TWENTY_PERCENT = "TOP20P",
  NONE = "NOT_ASSIGNED",
}

export enum ParCycleViewTabs {
  ONGOING = "ongoing",
  HISTORY = "history",
}

export enum FeedbackTypes {
  OFFERED = "offered",
  REQUESTED = "requested",
}

export const parRatingNotAssigned = "NOT_ASSIGNED";

export interface ParReportEntry {
  parRatingId: number;
  parCycleId: number;
  parEmployeeEmail: string;
  parEmployeeName: string;
  parCompany: string;
  parLocation: string;
  parBusinessUnit: string;
  parDepartment: string;
  parTeam: string;
  parSubTeam: string;
  parLeadEmail: string;
  parRating: string;
  parSpecialRating: ParSpecialRating;
  parEmployeeStatus: ParEmployeeStatus;
  parLeadStatus: ParLeadStatus;
  parF2fStatus: ParF2fStatus;
  parEmployeeAcceptanceStatus: string;
  parDirectLead?: string;
  reportingType?: string;
  isEmployeeALead?: string;
}

export interface SpecialRatingAllocation {
  parQuotaId: number;
  parTop5Quota: number;
  parTop20Quota: number;
  parSpecialQuotaName: string;
  parDepartment: string;
  parBusinessUnit: string;
  highlight?: boolean;
}

export interface ParRatingSummary {
  parSharedBy: string;
  parCycleId: number;
  parCycleName: string;
  parCycleStartDate: string;
  parCycleEndDate: string;
  parUpdatedOn: string;
  parEmployeeStatus: ParEmployeeStatus;
  parLeadStatus: ParLeadStatus;
  parLeadEmail: string;
  parCycleStatus: ParCycleStatus;
}

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
}
