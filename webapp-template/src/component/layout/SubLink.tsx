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
import Tooltip from "@mui/material/Tooltip";
import { Link, matchPath, useLocation } from "react-router-dom";

import React from "react";

interface SubLinkProps {
  icon?: React.ReactElement;
  primary: string;
  to: string;
  open: boolean;
  parentPath: string;
}

const SubLink = (props: SubLinkProps) => {
  const { icon, primary, to, open, parentPath } = props;
  const location = useLocation();

  const fullPath = parentPath.replace(/\/$/, "") + "/" + to.replace(/^\//, "");

  const isActive = !!matchPath({ path: fullPath, end: true }, location.pathname);

  return (
    <>
      {open ? (
        <Link
          to={fullPath}
          className={`flex items-center gap-2 p-2 rounded-lg justify-start 
        ${isActive ? "text-st-nav-clicked" : " text-st-nav-link hover:bg-st-nav-hover-bg hover:text-st-nav-hover "}`}
        >
          {icon && <span>{icon}</span>}
          {open && <p className="p-m">{primary}</p>}
        </Link>
      ) : (
        <Link to={fullPath}>
          {icon && React.isValidElement(icon) ? (
            <Tooltip
              title={primary}
              placement="right"
              arrow
              classes={{
                tooltip: "custom-sub-tooltip",
                arrow: "custom-tooltip-arrow",
              }}
            >
              {React.cloneElement(icon as React.ReactElement<any>, {
                size: 24,
                className: `w-5 h-5 ${
                  isActive
                    ? "text-st-nav-clicked"
                    : "text-st-nav-link hover:bg-st-nav-hover-bg hover:text-st-nav-hover"
                }`,
              })}
            </Tooltip>
          ) : (
            icon
          )}
        </Link>
      )}
    </>
  );
};

export default SubLink;
