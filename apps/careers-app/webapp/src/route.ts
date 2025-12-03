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
import { View } from "@view/index";
import { Role } from "@slices/authSlice/auth";
import PersonIcon from '@mui/icons-material/Person';
import { isIncludedRole } from "@utils/utils";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import { RouteObject, NonIndexRouteObject } from "react-router-dom";

export interface RouteObjectWithRole extends NonIndexRouteObject {
  allowRoles: string[];
  icon:
  | React.ReactElement<any, string | React.JSXElementConstructor<any>>
  | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  hideInSidebar?: boolean;
}

interface RouteDetail {
  path: string;
  allowRoles: string[];
  icon:
  | React.ReactElement<any, string | React.JSXElementConstructor<any>>
  | undefined;
  text: string;
  bottomNav?: boolean;
}

export const routes: RouteObjectWithRole[] = [
  {
    path: "/",
    text: "Home",
    icon: React.createElement(HomeIcon),
    element: React.createElement(View.home),
    allowRoles: [Role.ADMIN, Role.TEAM],
  },
    {
    path: "/vacancies",
    text: "Vacancies",
    icon: React.createElement(WorkIcon),
    element: React.createElement(View.vacancies),
    allowRoles: [Role.ADMIN, Role.TEAM],
  },
  {
    path: "/vacancies/:id",
    text: "Vacancy Detail",
    icon: React.createElement(WorkIcon),
    element: React.createElement(View.vacancyDetail),
    allowRoles: [Role.ADMIN, Role.TEAM],
    hideInSidebar: true,
  },
  {
    path: "/profile",
    text: "Profile",
    icon: React.createElement(PersonIcon),
    element: React.createElement(View.applicants),
    allowRoles: [Role.ADMIN, Role.TEAM],
  },
  {
    path: "/help",
    text: "Help",
    icon: React.createElement(HelpOutlineIcon),
    element: React.createElement(View.help),
    allowRoles: [Role.ADMIN, Role.TEAM],
    bottomNav: true,
  },
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
        children: getActiveRoutesV2(routeObj.children, roles),
      });
    }
  });

  return routesObj;
};

export const getActiveRoutes = (roles: string[]): RouteObject[] => {
  var routesObj: RouteObject[] = [];
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
    if (isIncludedRole(roles, routeObj.allowRoles) && !routeObj.hideInSidebar) {
      routesObj.push({
        path: routeObj.path ? routeObj.path : "",
        ...routeObj,
      });
    }
  });
  return routesObj;
};
