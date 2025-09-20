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

import { ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";

import pJson from "@root/package.json";
import { useState, useMemo } from "react";
import { getActiveRouteDetails } from "@src/route";
import { ColorModeContext } from "@src/App";
import SidebarNavItem from "@root/src/component/layout/SidebarNavItem";
import type { NavState } from "@root/src/types/types";

interface SidebarProps {
  open: boolean;
  handleDrawer: () => void;
  roles: string[];
  currentPath: string;
}

const Sidebar = (props: SidebarProps) => {
  const allRoutes = useMemo(
    () => getActiveRouteDetails(props.roles),
    [props.roles]
  );

  // Single state object for nav state
  const [navState, setNavState] = useState<NavState>({
    hovered: null,
    active: null,
    expanded: null,
  });

  // Handlers
  const handleClick = (idx: number) => {
    setNavState((prev) => ({
      ...prev,
      active: idx,
      expanded: prev.expanded === idx ? null : idx,
    }));
  };

  const handleMouseEnter = (idx: number) => {
    setNavState((prev) => ({ ...prev, hovered: idx }));
  };

  const handleMouseLeave = () => {
    setNavState((prev) => ({ ...prev, hovered: null }));
  };

  return (
    <ColorModeContext.Consumer>
      {(colorMode) => (
        <div
          className={`h-full p-2 bg-st-secondary-100 z-10 flex flex-col ${
            props.open ? "w-60" : "w-fit"
          } overflow-visible`}
        >
          {/* Navigation List */}
          <div
            className={`
              flex flex-col gap-2 overflow-visible
              ${props.open ? "w-full" : "w-fit"}
            `}
          >
            {allRoutes.map(
              (route, idx) =>
                !route.bottomNav && (
                  <div
                    key={idx}
                    onMouseEnter={() => handleMouseEnter(idx)}
                    onMouseLeave={handleMouseLeave}
                    className={`
                      ${props.open ? "w-full" : "w-fit"}
                      ${props.open ? "cursor-pointer" : "cursor-default"}
                    `}
                  >
                    <SidebarNavItem
                      route={route}
                      open={props.open}
                      isActive={navState.active === idx}
                      isHovered={navState.hovered === idx}
                      isExpanded={navState.expanded === idx}
                      onClick={() => handleClick(idx)}
                    />
                  </div>
                )
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="bottom-0 left-0 w-full flex items-center justify-between">
            <div className="flex flex-col gap-2 w-full">
              {/* Bottom Navigation Items */}
              {allRoutes.map(
                (route, idx) =>
                  route.bottomNav && (
                    <div
                      key={idx}
                      className={`${props.open ? "w-full" : "w-fit"}`}
                    >
                      <SidebarNavItem
                        route={route}
                        open={props.open}
                        isActive={navState.active === idx}
                        isHovered={navState.hovered === idx}
                        isExpanded={navState.expanded === idx}
                        onClick={() => handleClick(idx)}
                      />
                    </div>
                  )
              )}

              {/* Control Buttons */}
              <div className="flex flex-col gap-2 pl-[2px]">
                {/* Theme Toggle Button */}
                <div className="relative group">
                  <button
                    onClick={colorMode.toggleColorMode}
                    className="
                      w-fit p-2 text-white rounded-md cursor-pointer
                      hover:bg-st-nav-link-hover transition-colors duration-200"
                  >
                    {colorMode.mode === "dark" ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                  </button>

                  {/* Tooltip */}
                  {!props.open && (
                    <div
                      className="
                      absolute left-full ml-2 top-1/2 -translate-y-1/2
                      bg-gray-900 text-white text-sm px-2 py-1 rounded
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50
                      shadow-lg"
                    >
                      Switch to {colorMode.mode === "dark" ? "light" : "dark"}{" "}
                      mode
                    </div>
                  )}
                </div>

                {/* Sidebar Toggle Button */}
                <div className="relative group">
                  <button
                    onClick={props.handleDrawer}
                    className="
                      w-fit p-2 text-white rounded-md cursor-pointer
                      hover:bg-white/5 transition-colors duration-200"
                  >
                    {!props.open ? (
                      <ChevronRight className="w-5 h-5" />
                    ) : (
                      <ChevronLeft className="w-5 h-5" />
                    )}
                  </button>

                  {/* Tooltip */}
                  {!props.open && (
                    <div
                      className="
                      absolute left-full ml-2 top-1/2 -translate-y-1/2
                      bg-gray-900 text-white text-sm px-2 py-1 rounded
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50
                      shadow-lg"
                    >
                      {props.open ? "Collapse" : "Expand"} Sidebar
                    </div>
                  )}
                </div>

                {/* Sidebar Toggle Button */}
                <div className="relative group">
                  <button
                    className="
                      w-full p-2 text-white duration-200"
                  >
                    {!props.open ? (
                      <p>v1</p>
                    ) : (
                      <p>
                        v {pJson.version} | © {new Date().getFullYear()} WSO2
                        LLC
                      </p>
                    )}
                  </button>

                  {/* Tooltip */}
                  {!props.open && (
                    <div
                      className="
                      absolute left-full ml-2 top-1/2 -translate-y-1/2
                      bg-gray-900 text-white text-sm px-2 py-1 rounded
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50
                      shadow-lg"
                    >
                      v {pJson.version} | © {new Date().getFullYear()} WSO2 LLC
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ColorModeContext.Consumer>
  );
};

export default Sidebar;
