// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { NonIndexRouteObject } from "react-router-dom";
import { View } from "./views";
import React from "react";
import { isIncludedRole } from "./utils/utils";

// icons
import DataUsageIcon from "@mui/icons-material/DataUsage";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/Shield";

import { Role } from "@utils/types";

export interface RouteObjectWithRole extends NonIndexRouteObject {
  allowRoles: Role[];
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
}

interface RouteDetail {
  path: string;
  allowRoles: Role[];
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  text: string;
  bottomNav?: boolean;
}

export const routes: RouteObjectWithRole[] = [
  {
    path: "/",
    text: "Employee Portal",
    icon: React.createElement(DataUsageIcon),
    element: React.createElement(View.OngoingCycleView),
    allowRoles: [Role.EMPLOYEE],
  },
  {
    path: "/lead-portal",
    text: "Lead Portal",
    icon: React.createElement(GroupsIcon),
    element: React.createElement(View.LeadPortal),
    allowRoles: [Role.TEAM_LEAD],
  },
  {
    path: "/admin-portal",
    text: "Admin Portal",
    icon: React.createElement(ShieldIcon),
    element: React.createElement(View.AdminPortal),
    allowRoles: [Role.ADMIN],
  },
  {
    path: "/history",
    text: "PAR History",
    icon: React.createElement(HistoryIcon),
    element: React.createElement(View.ParHistory),
    allowRoles: [Role.EMPLOYEE],
  },
  {
    path: "/settings",
    text: "Settings",
    icon: React.createElement(SettingsIcon),
    element: React.createElement(View.GlobalSettings),
    allowRoles: [Role.ADMIN],
  },
  {
    path: "/profile",
    text: "Profile",
    icon: React.createElement(PersonIcon),
    element: React.createElement(View.Profile),
    allowRoles: [Role.EMPLOYEE],
  },
];

export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: Role[]
): RouteObjectWithRole[] => {
  if (!routes) return [];
  var routesObj: RouteObjectWithRole[] = [];
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

export const getActiveRouteDetails = (roles: Role[]): RouteDetail[] => {
  var routesObj: RouteDetail[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        path: routeObj.path ? routeObj.path : "",
        ...routeObj,
      });
    }
  });
  return routesObj;
};
