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
import { 
  History, 
  CalendarX2,
  FileText,
  Briefcase,
} from 'lucide-react';
import type { RouteObject } from "react-router-dom";

import React from "react";

import { Role } from "@slices/authSlice/auth";
import { isIncludedRole } from "@utils/utils";
import { SabbaticalLeave } from "@view/index";

import type { RouteDetail, RouteObjectWithRole } from "./types/types";
import LeaveHistory from './layout/pages/LeaveHistory';
import LeadReport from './layout/pages/LeadReport';
import GeneralLeave from "./layout/pages/GeneralLeave";

export const routes: RouteObjectWithRole[] = [
  {
    path: "general-leave",          
    text: "General Leave", 
    icon: React.createElement(Briefcase),
    element: React.createElement(GeneralLeave),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },
  {
    path: "sabbatical-leave",       
    text: "Sabbatical Leave",      
    icon: React.createElement(CalendarX2),
    element: React.createElement(SabbaticalLeave), 
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },
  {
    path: "leave-history",          
    text: "Leave History",         
    icon: React.createElement(History),
    element: React.createElement(LeaveHistory),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },
  {
    path: "lead-report",
    text: "Lead Report",
    icon: React.createElement(FileText),
    element: React.createElement(LeadReport),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },
];

export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: string[],
): RouteObjectWithRole[] => {
  if (!routes) return [];
  const routesObj: RouteObjectWithRole[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
        children: getActiveRoutesV2(routeObj.children, roles),
      });
    }
  });

  return routesObj;
};

export const getActiveRoutes = (roles: string[]): RouteObject[] => {
  const routesObj: RouteObject[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
      });
    }
  });
  return routesObj;
};

export const getActiveRouteDetails = (roles: string[]): RouteDetail[] => {
  const routesObj: RouteDetail[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
        path: routeObj.path ?? "",
      });
    }
  });
  return routesObj;
};

interface getActiveParentRoutesProps {
  routes: RouteObjectWithRole[] | undefined;
  roles: string[];
}

export const getActiveParentRoutes = ({ routes, roles }: getActiveParentRoutesProps): string[] => {
  if (!routes) return [];

  let activeParentPaths: string[] = [];

  routes.forEach((routeObj) => {
    if (!routeObj.element) return;

    if (isIncludedRole(roles, routeObj.allowRoles)) {
      if (routeObj.path) {
        activeParentPaths.push(routeObj.path);
      }
    }
  });

  return activeParentPaths;
};
