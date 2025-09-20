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
import { RouteDetail } from "@root/src/types/types";
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { ChevronUp as ChevronUpIcon } from "lucide-react";

import React from "react";

interface ListItemLinkProps {
  icon?: React.ReactElement;
  label: string;
  open: boolean;
  isActive: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  route?: RouteDetail;
}

const LinkItem = (props: ListItemLinkProps) => {
  const { icon, label, open, isActive, isExpanded, hasChildren } = props;

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg w-full justify-between transition-all duration-200
        ${
          isActive || isExpanded
            ? "bg-st-nav-clicked-bg text-st-nav-clicked"
            : "text-st-nav-link hover:bg-st-nav-hover-bg hover:text-st-nav-hover"
        }
      `}
    >
      <div className="flex items-center gap-2 justify-start ">
        {icon && <span className="text-[24px]">{icon}</span>}
        {open && <p className="p-m">{label}</p>}
      </div>
      {hasChildren && open && (isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />)}
    </div>
  );
};
export default LinkItem;
