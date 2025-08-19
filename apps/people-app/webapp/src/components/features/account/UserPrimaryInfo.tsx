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

import type { User } from "@/types";
import { Avatar } from "@mui/material";

/**
 * UserPrimaryInfo Component
 *
 * Displays a user's primary information including their name, email,
 * and profile picture (avatar). If an avatar is not provided, a fallback
 * avatar is rendered instead.
 *
 * Typically used in account-related pages (e.g., profile headers or dashboards)
 * where quick access to user identity info is needed.
 *
 * Props:
 * - name: string – the user's display name
 * - email: string – the user's email address
 * - avatar?: string – optional URL to the user's avatar image
 */
function UserPrimaryInfo(props: User) {
  function stringAvatar(name: string) {
    return {
      children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`,
    };
  }

  return (
    <section className="flex justify-between bg-white sticky pt-4 pb-[0.5rem] top-0 z-50">
      <div>
        <h1 className="font-semibold text-xl">{props.name}</h1>
        <h2 className="font-medium text-lg text-[#707070] leading-[1.5rem]">
          {props.email}
        </h2>
      </div>
      <div className="w-11 h-11 bg-gray-300 rounded-full relative overflow-hidden">
        {props.avatar ? (
          <img
            src={props.avatar}
            className="absolute object-cover w-full h-full"
          />
        ) : (
          <Avatar
            style={{ width: "100%", height: "100%" }}
            {...stringAvatar("Kent Dodds")}
          >
            {`${props?.name?.split(" ")[0][0]}${props?.name?.split(" ")[1][0]}`}
          </Avatar>
        )}
      </div>
    </section>
  );
}

export default UserPrimaryInfo;
