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

export interface TimeLineData{
  Title: string;
  Date: string;
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
