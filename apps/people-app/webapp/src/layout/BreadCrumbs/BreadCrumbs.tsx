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

import * as React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link, useLocation } from "react-router-dom";
import { Tooltip } from "@mui/material";
import { selectRoles } from "@root/src/slices/authSlice/auth";
import { useSelector } from "react-redux";
import { routes, getActiveParentRoutes } from "@root/src/route";

const MAX_LENGTH = 5;

function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
  event.preventDefault();
}

export default function BasicBreadcrumbs() {
  const location = useLocation();
  const roles = useSelector(selectRoles);

  const activeParentPaths = getActiveParentRoutes({ routes, roles }).map(
    (route) => {
      if (route === "/") return "/";
      return route.slice(1);
    }
  );
  const { pathname } = location;
  const pathnames = ["", ...pathname.split("/").filter(Boolean)];

  return (
    <div role="presentation" className="-mb-[1px]" onClick={handleClick}>
      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
          "& .MuiBreadcrumbs-separator": {
            marginLeft: "4px",
            marginRight: "4px",
            fontSize: "12px",
            lineHeight: 1,
          },
        }}
      >
        {pathnames.map((path, index) => {
          // Build the route to this breadcrumb
          const routeTo = `${pathnames
            .slice(0, index + 1)
            .filter(Boolean)
            .map((seg) => seg.trim())
            .join("/")}`;

          const isLast = index === pathnames.length - 1;

          // Check if the path is an active path or not
          const isActive = activeParentPaths.includes(path);

          const isLong = path.length >= MAX_LENGTH;
          const label =
            !isLast && isLong ? (
              <Tooltip title={path}>
                <span>{path.slice(0, 4)}...</span>
              </Tooltip>
            ) : (
              <span>{path}</span>
            );

          return isActive && !isLast ? (
            <Link
              key={path}
              to={routeTo}
              className="no-underline text-Color-text-600"
            >
              <div className="p-s">{label}</div>
            </Link>
          ) : (
            <div key={path} className="no-underline text-Color-text-600">
              <p className="p-s">{label}</p>
            </div>
          );
        })}
      </Breadcrumbs>
    </div>
  );
}
