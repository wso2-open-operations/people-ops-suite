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

import { PromotionRequest,  } from "./types";
import { ApplicationState } from "../types/types";

export const isIncludedRole = (a: string[], b: string[]): boolean => {
  return [...getCrossItems(a, b), ...getCrossItems(b, a)].length > 0;
};

export const capitalizedFLWords = (str: string) => {
  str = str.toLowerCase();
  const arr = str.split(" ");

  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
  }

  return arr.join(" ");
};

function getCrossItems<Role>(a: Role[], b: Role[]): Role[] {
  return a.filter((element) => {
    return b.includes(element);
  });
}

export const getApplicationCountBasedOnState = (
  requests: PromotionRequest[] | null,
  statuses: ApplicationState[],
) => {
  if (requests === null) return 0;

  let count = 0;
  requests.forEach((request) => {
    if (statuses.includes(request.status)) {
      count++;
    }
  });
  return count;
};
