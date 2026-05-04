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

import { lazy } from "react";

const help = lazy(() => import("@view/help/help"));
const history = lazy(() => import("@view/history/promotionHistory"));
const individualContributor = lazy(() => import("@view/individualContributor/individualContributor"));
const timeBased = lazy(() => import("@view/timeBased/timeBased"));
const functionaLead = lazy(() => import("@view/functionalLead/functionalLead"));
const promotionBoard = lazy(() => import("@view/promotionBoard/promotionBoard"));

export const View = {
  help,
  history,
  individualContributor,
  timeBased,
  functionaLead,
  promotionBoard,
};
