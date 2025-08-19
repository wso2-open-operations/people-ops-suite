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

import { Link } from "react-router-dom";
import type { ServiceInfo } from "@/types";

/**
 * ServiceTile Component
 *
 * Renders a clickable tile representing a service. Displays the service name,
 * a short description, and an icon. On click, it navigates to the provided route.
 *
 * Typically used in service listings, dashboards, or menus where multiple services
 * are shown as individual items the user can interact with.
 *
 * Props (from ServiceInfo type):
 * - name: string – name/title of the service
 * - description: string – brief info or summary of the service
 * - icon: JSX.Element – visual icon representing the service
 * - route: string – path to navigate to when the tile is clicked
 */
function ServiceTile(props: ServiceInfo) {
  return (
    <Link to={props.route}>
      <div className="flex items-center justify-between py-[0.88rem] border-b-[1px] border-[#E5E5E5]">
        <div className="mr-5">
          <h3 className="font-semibold text-lg">{props.name}</h3>
          <p className="font-medium text-sm text-[#808080]">
            {props.description}
          </p>
        </div>
        <div className="w-[3.7rem] h-[3.7rem] bg-[#FFE1C9] rounded-[1.3rem] relative overflow-hidden shrink-0">
          {props.icon}
        </div>
      </div>
    </Link>
  );
}

export default ServiceTile;
