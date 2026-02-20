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

import type { RouteObject } from "react-router-dom";
import { View } from "./views";
import React from "react";
import { isIncludedRole } from "./utils/utils";

// icons
import DataUsageIcon from "@mui/icons-material/DataUsage";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/Shield";
import { Role } from "@utils/types";
import type { RouteDetail, RouteObjectWithRole } from "./types/types";

export const routes: RouteObjectWithRole[] = [
  // {
  //   path: "/",
  //   text: "Employee Portal",
  //   icon: React.createElement(DataUsageIcon),
  //   element: React.createElement(View.OngoingCycleView),
  //   allowRoles: [Role.EMPLOYEE],
  // },
  // {
  //   path: "/lead-portal",
  //   text: "Lead Portal",
  //   icon: React.createElement(GroupsIcon),
  //   element: React.createElement(View.LeadPortal),
  //   allowRoles: [Role.TEAM_LEAD],
  // },
  {
    path: "/admin-portal",
    text: "Admin Portal",
    icon: React.createElement(ShieldIcon),
    allowRoles: [Role.ADMIN],
    children: [
      {
        path: "/admin-portal/ongoing",
        text: "Ongoing Cycles",
        icon: React.createElement(DataUsageIcon),
        element: React.createElement(View.AdminOngoingView),
        allowRoles: [Role.ADMIN],
      },
      {
        path: "/admin-portal/history",
        text: "History",
        icon: React.createElement(HistoryIcon),
        element: React.createElement(View.AdminHistoryView),
        allowRoles: [Role.ADMIN],
      },
    ],
  },
  // {
  //   path: "/history",
  //   text: "PAR History",
  //   icon: React.createElement(HistoryIcon),
  //   element: React.createElement(View.ParHistory),
  //   allowRoles: [Role.EMPLOYEE],
  // },
  {
    path: "/settings",
    text: "Settings",
    icon: React.createElement(SettingsIcon),
    element: React.createElement(View.GlobalSettings),
    allowRoles: [Role.ADMIN],
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
