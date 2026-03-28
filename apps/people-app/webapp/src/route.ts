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
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import { CircleQuestionMark } from "lucide-react";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

import React from "react";

import { Role } from "@slices/authSlice/auth";
import { isIncludedRole } from "@utils/utils";
import { View } from "@view/index";

import type { RouteDetail, RouteObjectWithRole } from "./types/types";

export const routes: RouteObjectWithRole[] = [
  {
    path: "/",
    text: "Me",
    icon: React.createElement(AccountCircleIcon),
    element: React.createElement(View.me),
    allowRoles: [Role.ADMIN],
  },
  {
    path: "/onboarding",
    text: "Onboarding",
    icon: React.createElement(GroupsIcon),
    element: React.createElement(View.employees),
    allowRoles: [Role.ADMIN],
  },
 {
    path: "/master-data",
    text: "Master Data",
    icon: React.createElement(AccountTreeOutlinedIcon),
    element: React.createElement(View.masterData),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },
  // Temporarily remove the help route
  // {
  //   path: "/help",
  //   text: "Help & Support",
  //   icon: React.createElement(CircleQuestionMark),
  //   element: React.createElement(View.help),
  //   allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  //   bottomNav: true,
  // },
];

export const getAllowedRoutes = (roles: string[]): RouteDetail[] => {
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
