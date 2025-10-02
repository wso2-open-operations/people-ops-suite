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
import BusinessIcon from "@mui/icons-material/Business";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
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
}

export const routes: RouteObjectWithRole[] = [
  {
    path: "/",
    text: "Home",
    icon: React.createElement(HomeIcon),
    element: React.createElement(View.home),
    allowRoles: [Role.ADMIN],
  },
  {
    path: "/profile",
    text: "Profile",
    icon: React.createElement(PersonIcon),
    element: React.createElement(View.profile),
    allowRoles: [Role.ADMIN],
    children: [
      {
        path: "/profile/user",
        text: "User",
        icon: React.createElement(AccountCircleIcon),
        element: React.createElement(View.userProfile),
        allowRoles: [Role.ADMIN],
      },
      {
        path: "/profile/company",
        text: "Company",
        icon: React.createElement(BusinessIcon),
        element: React.createElement(View.companyProfile),
        allowRoles: [Role.ADMIN],
      },
    ],
  },
  {
    path: "/settings",
    text: "Settings",
    icon: React.createElement(SettingsIcon),
    element: React.createElement(View.settings),
    allowRoles: [Role.ADMIN],
    children: [
      {
        path: "/settings/user",
        text: "User",
        icon: React.createElement(AccountCircleIcon),
        element: React.createElement(View.userSettings),
        allowRoles: [Role.ADMIN],
      },
      {
        path: "/settings/company",
        text: "Company",
        icon: React.createElement(BusinessIcon),
        element: React.createElement(View.companySettings),
        allowRoles: [Role.ADMIN],
      },
    ],
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
];
export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: string[]
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
