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
import type { BasicUserInfo, DecodedIDTokenPayload } from "@asgardeo/auth-spa";
import type { NonIndexRouteObject } from "react-router-dom";

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

export enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

// Auth-related types
export interface ExtendedDecodedIDTokenPayload extends DecodedIDTokenPayload {
  groups?: string[];
}

export interface AuthState {
  status: State;
  mode: "active" | "maintenance";
  statusMessage: string | null;
  userInfo: BasicUserInfo | null;
  decodedIdToken: ExtendedDecodedIDTokenPayload | null;
  roles: Role[];
}

export interface AuthData {
  userInfo: BasicUserInfo;
  decodedIdToken: ExtendedDecodedIDTokenPayload;
}

export interface UserInfoInterface {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  jobRole: string;
  privileges: number[];
  managerEmail: string;
  department: string;
  team: string;
}

export interface UserState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  userInfo: UserInfoInterface | null;
}

export enum ConfirmationType {
  update = "update",
  send = "send",
  upload = "upload",
  accept = "accept",
}

export interface RouteDetail {
  path: string;
  allowRoles: string[];
  icon: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  element?: React.ReactNode;
}

export interface RouteObjectWithRole extends NonIndexRouteObject {
  allowRoles: string[];
  icon: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  element?: React.ReactNode;
}

export interface RawMetaData {
  title: string;
  description: string;
}

export interface RawMenu {
  date: string;
  breakfast: RawMetaData;
  juice: RawMetaData;
  lunch: RawMetaData;
  dessert: RawMetaData;
  snack: RawMetaData;
}

export interface MetaData {
  title: string | null;
  description: string | null;
}

export interface Menu {
  date: string;
  breakfast: MetaData;
  juice: MetaData;
  lunch: MetaData;
  dessert: MetaData;
  snack: MetaData;
}

export enum MealOption {
  vegetarian = "Vegetarian",
  fish = "Fish",
  chicken = "Chicken",
}

export interface DinnerRequest {
  id?: string;
  mealOption: MealOption;
  date: string;
  department: string;
  team?: string;
  managerEmail: string;
  timestamp?: string;
}
