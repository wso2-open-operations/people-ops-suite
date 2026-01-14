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

import React from "react";

import { NonIndexRouteObject } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import { Role } from "@slices/authSlice/auth";
import { isIncludedRole } from "@utils/utils";
import { View } from "@view/index";

export interface RouteObjectWithRole extends NonIndexRouteObject {
  allowRoles: string[];
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  hideFromSidebar?: boolean;
}

export interface RouteDetail {
  path: string;
  allowRoles: string[];
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  hideFromSidebar?: boolean;
}

export const routes: RouteObjectWithRole[] = [
  {
    path: "/",
    text: "Me",
    icon: React.createElement(AccountCircleIcon),
    element: React.createElement(View.me),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },
  {
    path: "/employees",
    text: "Employees",
    icon: React.createElement(GroupsIcon),
    element: React.createElement(View.employeeOnboarding),
    allowRoles: [Role.ADMIN],
    children:[
      {
        path: "/employees/view",
        text: "Employees",
        icon: React.createElement(GroupsIcon),
        element: React.createElement(View.employeesList),    
        allowRoles: [Role.ADMIN],
      },
      {
        path: "/employees/onboarding",
        text: "Onboarding",
        icon: React.createElement(GroupsIcon),
        element: React.createElement(View.employees),
        allowRoles: [Role.ADMIN],
      },
      
    ]
  },
  // Todo: Uncomment when help view is ready
  // {
  //   path: "/help",
  //   text: "Help",
  //   icon: React.createElement(HelpOutlineIcon),
  //   element: React.createElement(View.help),
  //   allowRoles: [Role.ADMIN, Role.TEAM],
  //   bottomNav: true,
  // },
  {
    path: "/employees/:employeeId",
    text: "Employees",
    icon: React.createElement(GroupsIcon),
    element: React.createElement(View.employeeDetails),
    allowRoles: [Role.ADMIN],
    hideFromSidebar: true,
  },
  {
    path: "/employees/:employeeId/edit",
    text: "Edit Employee",
    icon: React.createElement(GroupsIcon),
    element: React.createElement(View.employeeEdit),
    allowRoles: [Role.ADMIN],
    hideFromSidebar: true,
  },
];
export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: string[],
): RouteObjectWithRole[] => {
  if (!routes) return [];
  var routesObj: RouteObjectWithRole[] = [];
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
