import { StdioNull } from "child_process";
import { ApplicationState, RecommendationState } from "../types/types";
import type { BasicUserInfo } from "@asgardeo/auth-spa";

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
}

export type PromotionRequestType =
  | "NORMAL"
  | "SPECIAL"
  | "TIME_BASED"
  | "INDIVIDUAL_CONTRIBUTOR";

export enum Role {
  HR_ADMIN = "HR_ADMIN",
  PROMOTION_BOARD_MEMBER = "PROMOTION_BOARD_MEMBER",
  FUNCTIONAL_LEAD = "FUNCTIONAL_LEAD",
  EMPLOYEE = "EMPLOYEE",
  LEAD = "LEAD"
}

export interface TimeLineData{
  Title: string;
  PromotionCycle: string;
  BusinessUnit: string;
  Team: string;
  SubTeam: string;
  Lead: string
}

export interface Employee {
  firstName : string;
  lastName: string;
  workEmail : string;
  jobBand  : number | null;
  jobRole  : string;
  employeeThumbnail : string | null;
  lastPromotedDate : string | null;
  managerEmail : string | null;
  startDate : string | null;
  employmentType : string;
  businessUnit : string;
  department : string;
  team  : string | null;
  subTeam : string | null;
}

export interface ActivePromotionCycleInterface {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: PromotionCycleStatus;
}

export type PromotionCycleStatus = "OPEN" | "CLOSED" | "END";

export interface PromotionRequest {
  currentJobBand: number;
  employeeEmail: string;
  employeeImageUrl: string;
  id: number;
  promotionType: PromotionRequestType;
  nextJobBand: number;
  promotionCycle: string;
  promotionStatement: string;
  backupPromotionStatement: string;
  recommendations: RecommendationInterface[];
  status: ApplicationState;

  reasonForRejection: string;

  businessUnit: string;
  department: string;
  team: string;
  subTeam: string;
  joinDate: string;
  lastPromotedDate: string;
  location: string;
  currentJobRole: string;

  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
  isNotificationEmailSent: boolean;
}

export interface RecommendationInterface {
  promotionCycleId: string;
  promotionCycle: string;
  employeeName: string;
  employeeEmail: string;
  recommendationStatement: string | null;
  recommendationAdditionalComment: string | null;
  promotingJobBand: number;
  promotionType: string;
  promotionRequestStatus: ApplicationState;
  reasonForRejection: string | null;
  currentJobBand: number;
  leadEmail: string;
  recommendationID: number;
  recommendationStatus: RecommendationState;
  reportingLead: boolean;
  isSample: boolean;
}

export interface Entity {
  id: number;
  name: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  jobBand?: number;
  email: string;
  roles: Role[];
  businessUnit: boolean;
  employeeThumbnail: string;
  functionalLeadAccessLevels: {
    businessUnits: BUAccessLevel[];
  } | null;
  active: boolean;
}

export interface BUAccessLevel extends Entity {
  departments?: DepartmentAccess[];
}

export interface DepartmentAccess extends Entity {
  teams?: TeamAccess[];
}

export interface TeamAccess extends Entity {
  subTeams?: Entity[];
}

export interface EmployeeData {
  firstName: string,
  lastName: string,
  workEmail: string,
  jobBand: number | null,
  jobRole: string,
  employeeThumbnail: string,
  lastPromotedDate: string | null,
  managerEmail: string,
  startDate: string,
  employmentType: string,
  businessUnit: string,
  department: string,
  team: string,
  subTeam: string
}
