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
import { Tooltip, TooltipContent, TooltipTrigger } from "@root/components/ui/tooltip";
import pJson from "@root/package.json";
import SidebarNavItem from "@root/src/component/layout/SidebarNavItem";
import MeCard from "@root/src/component/ui/MeCard";
import type { NavState } from "@root/src/types/types";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";

import { ReactNode, useMemo, useState } from "react";

import { ColorModeContext } from "@src/App";
import { getActiveRouteDetails } from "@src/route";

interface SidebarProps {
  open: boolean;
  handleDrawer: () => void;
  roles: string[];
  currentPath: string;
}

interface SidebarTogglesPropes {
  logic: boolean;
  content: string;
  onClickAction: () => void;
  trueContent: ReactNode;
  falseContent: ReactNode;
  styles?: string;
}

export const SidebarToggles = (props: SidebarTogglesPropes) => {
  const { logic, content, trueContent, falseContent, onClickAction, styles } = props;

  return (
    <Tooltip>
      <TooltipTrigger className={`flex ${styles ? styles : "items-start justify-start"}`}>
        <button
          onClick={onClickAction}
          className="w-fit p-2 text-st-nav-link rounded-md cursor-pointer hover:text-st-nav-hover hover:bg-st-nav-hover-bg transition-colors duration-200"
        >
          {logic ? <div>{trueContent}</div> : <div>{falseContent}</div>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const Sidebar = (props: SidebarProps) => {
  const allRoutes = useMemo(() => getActiveRouteDetails(props.roles), [props.roles]).filter(
    (route) => route.showInSidebar,
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
          <div className="my-3">
            <MeCard sidebarOpen={props.open} />
          </div>

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
                ),
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
                    <div key={idx} className={`${props.open ? "w-full" : "w-fit"}`}>
                      <SidebarNavItem
                        route={route}
                        open={props.open}
                        isActive={navState.active === idx}
                        isHovered={navState.hovered === idx}
                        isExpanded={navState.expanded === idx}
                        onClick={() => handleClick(idx)}
                      />
                    </div>
                  ),
              )}

              <div className="flex flex-col gap-2 pl-[2px]">
                {/* Color swipe button */}
                <SidebarToggles
                  logic={colorMode.mode === "dark"}
                  content={`Switch to ${colorMode.mode === "dark" ? "light" : "dark"} mode`}
                  onClickAction={colorMode.toggleColorMode}
                  trueContent={<Sun className="w-5 h-5" />}
                  falseContent={<Moon className="w-5 h-5" />}
                />

                {/* Sidebar collapse button */}
                <SidebarToggles
                  logic={props.open}
                  content={props.open ? "Collapse Sidebar" : "Expand Sidebar"}
                  onClickAction={props.handleDrawer}
                  trueContent={<ChevronLeft className="w-5 h-5" />}
                  falseContent={<ChevronRight className="w-5 h-5" />}
                />

                {/* Version */}
                <>
                  <div className="w-full h-[1.5px] bg-white/20 "></div>
                  <SidebarToggles
                    logic={props.open}
                    content={`v ${pJson.version} | © ${new Date().getFullYear()} WSO2 LLC`}
                    onClickAction={() => {}}
                    trueContent={
                      <p className="p-s">
                        v {pJson.version} | © {new Date().getFullYear()} WSO2 LLC
                      </p>
                    }
                    falseContent={<p className="p-s">v1</p>}
                    styles="items-center justify-center"
                  />
                </>
              </div>
            </div>
          </div>
        </div>
      )}
    </ColorModeContext.Consumer>
  );
};

export default Sidebar;
