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
import { createSelector } from "@reduxjs/toolkit";

import { State } from "@/types/types";
import { State as AuthSliceState } from "@slices/authSlice/auth";

import { RootState } from "./store";

type RtkQueryRootSlice = {
  queries?: Record<string, { status?: string } | undefined | null>;
  mutations?: Record<string, { status?: string } | undefined | null>;
};

function rtkApiHasPending(api: RtkQueryRootSlice | undefined): boolean {
  if (!api) return false;
  const queryPending = Object.values(api.queries ?? {}).some(
    (q) => q != null && typeof q === "object" && q.status === "pending",
  );
  const mutationPending = Object.values(api.mutations ?? {}).some(
    (m) => m != null && typeof m === "object" && m.status === "pending",
  );
  return queryPending || mutationPending;
}

/** True when any slice `State` / auth status or RTK Query request is in a loading/pending state. */
export const isGlobalLoadingSelector = createSelector(
  (s: RootState) => s.auth.status === State.loading,
  (s: RootState) => s.user.state === State.loading,
  (s: RootState) => s.employee.state === State.loading,
  (s: RootState) => s.employee.employeeBasicInfoState === State.loading,
  (s: RootState) => s.employee.managersState === State.loading,
  (s: RootState) => s.employee.filteredEmployeesResponseState === State.loading,
  (s: RootState) => s.employee.updateJobInfoState === State.loading,
  (s: RootState) => s.employee.qrCodeState === State.loading,
  (s: RootState) => s.employeePersonalInfo.state === State.loading,
  (s: RootState) => s.organization.state === State.loading,
  (s: RootState) => s.organizationStructure.state === AuthSliceState.Loading,
  (s: RootState) => rtkApiHasPending(s.userApi),
  (s: RootState) => rtkApiHasPending(s.configApi),
  (s: RootState) => rtkApiHasPending(s.employeeApi),
  (s: RootState) => rtkApiHasPending(s.organizationApi),
  (...flags: boolean[]) => flags.some(Boolean),
);
