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

import AssignmentIcon from "@mui/icons-material/Assignment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import { type RouteObject } from "react-router-dom";

import React from "react";

import { Role } from "@slices/authSlice/auth";
import { isIncludedRole } from "@utils/utils";
import GeneralLeave from "@view/GeneralLeave/GeneralLeave";
import Report from "@view/LeadReport/Report";
import LeaveHistory from "@view/LeaveHistory/LeaveHistory";
import { SabbaticalLeave } from "@view/index";

import type { RouteDetail, RouteObjectWithRole } from "./types/types";

type RouteObjectWithMeta = RouteObjectWithRole & {
  text?: string;
  icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
  denyRoles?: string[];
};

export const routes: RouteObjectWithMeta[] = [
  {
    path: "",
    text: "General Leave",
    icon: React.createElement(WorkHistoryIcon),
    element: React.createElement(GeneralLeave),
    allowRoles: [Role.EMPLOYEE, Role.INTERN, Role.LEAD],
  },
  {
    path: "sabbatical-leave",
    text: "Sabbatical Leave",
    icon: React.createElement(EventAvailableIcon),
    element: React.createElement(SabbaticalLeave),
    allowRoles: [Role.EMPLOYEE, Role.LEAD],
    denyRoles: [Role.INTERN],
  },
  {
    path: "leave-history",
    text: "Leave History",
    icon: React.createElement(HistoryIcon),
    element: React.createElement(LeaveHistory),
    allowRoles: [Role.EMPLOYEE, Role.INTERN, Role.LEAD],
  },
  {
    path: "reports",
    text: "Reports",
    icon: React.createElement(AssignmentIcon),
    element: React.createElement(Report),
    allowRoles: [Role.LEAD, Role.PEOPLE_OPS_TEAM],
  },
];

export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: string[],
): RouteObjectWithRole[] => {
  if (!routes) return [];

  const routesObj: RouteObjectWithRole[] = [];

  routes.forEach((routeObj) => {
    if (
      (!routeObj.allowRoles || isIncludedRole(roles, routeObj.allowRoles)) &&
      (!routeObj.denyRoles || !isIncludedRole(roles, routeObj.denyRoles))
    ) {
      if (routeObj.index) {
        routesObj.push({ ...routeObj });
      } else {
        routesObj.push({
          ...routeObj,
          children: getActiveRoutesV2(routeObj.children, roles),
        });
      }
    }
  });

  return routesObj;
};

export const getActiveRoutes = (roles: string[]): RouteObject[] => {
  const routesObj: RouteObject[] = [];

  routes.forEach((routeObj) => {
    if (
      (!routeObj.allowRoles || isIncludedRole(roles, routeObj.allowRoles)) &&
      (!routeObj.denyRoles || !isIncludedRole(roles, routeObj.denyRoles))
    ) {
      routesObj.push({ ...routeObj });
    }
  });

  return routesObj;
};

export const getActiveRouteDetails = (roles: string[]): RouteDetail[] => {
  const routesObj: RouteDetail[] = [];

  routes.forEach((routeObj) => {
    if (
      (!routeObj.allowRoles || isIncludedRole(roles, routeObj.allowRoles)) &&
      (!routeObj.denyRoles || !isIncludedRole(roles, routeObj.denyRoles))
    ) {
      routesObj.push({
        path: routeObj.path ?? "",
        text: routeObj.text!,
        icon: routeObj.icon!,
        allowRoles: routeObj.allowRoles,
        denyRoles: routeObj.denyRoles,
        element: routeObj.element,
      });
    }
  });

  return routesObj;
};

interface GetActiveParentRoutesProps {
  routes: RouteObjectWithRole[] | undefined;
  roles: string[];
}

export const getActiveParentRoutes = ({ routes, roles }: GetActiveParentRoutesProps): string[] => {
  if (!routes) return [];

  const activeParentPaths: string[] = [];

  routes.forEach((routeObj) => {
    if (
      routeObj.path &&
      routeObj.element &&
      (!routeObj.allowRoles || isIncludedRole(roles, routeObj.allowRoles)) &&
      (!routeObj.denyRoles || !isIncludedRole(roles, routeObj.denyRoles))
    ) {
      activeParentPaths.push(routeObj.path);
    }
  });

  return activeParentPaths;
};
