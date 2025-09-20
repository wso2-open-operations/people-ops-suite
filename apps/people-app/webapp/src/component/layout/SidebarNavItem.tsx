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
import { RouteDetail } from "@root/src/types/types";
import { Link } from "react-router-dom";

import LinkItem from "./LinkItem";
import SidebarSubMenu from "./SidebarSubMenu";

function SidebarNavItem({
  route,
  isActive,
  isHovered,
  isExpanded,
  open,
  onClick,
}: {
  route: RouteDetail;
  isActive: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <div className={`relative group transition-shadow duration-200 w-full`}>
      <Tooltip
        title={!open ? route.text : ""}
        placement="right"
        arrow
        disableHoverListener={open}
        slotProps={{
          popper: { className: "z-[9999]" },
          tooltip: {
            className: "bg-gray-900 text-white px-3 py-1 rounded text-sm shadow-lg",
          },
          arrow: { className: "text-gray-900" },
        }}
      >
        {route.element ? (
          <Link to={route.path} className="w-full block" onClick={onClick}>
            <LinkItem
              label={route.text}
              icon={route.icon}
              open={open}
              isActive={isActive}
              isHovered={isHovered}
              isExpanded={isExpanded}
              hasChildren={!!(route.children && route.children.length > 0)}
              route={route}
            />
          </Link>
        ) : (
          <button className="w-full cursor-pointer" onClick={onClick}>
            <LinkItem
              label={route.text}
              icon={route.icon}
              open={open}
              isActive={isActive}
              isHovered={isHovered}
              isExpanded={isExpanded}
              hasChildren={!!(route.children && route.children.length > 0)}
              route={route}
            />
          </button>
        )}
      </Tooltip>
      {/* Render expanded children here, outside the Tooltip */}
      {route && route.children?.length && isExpanded && (
        <div
          key="nested"
          className={`left-full top-0 mt-2 flex flex-col gap-3 items-center justify-center ${
            open && "pl-5"
          }`}
        >
          <div
            className={`flex flex-col gap-3 w-full items-center justify-center ${
              open ? "border-l border-l-neutral-50 pl-2" : "pl-[11px]"
            }`}
          >
            <SidebarSubMenu parentRoute={route} open={open} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SidebarNavItem;
