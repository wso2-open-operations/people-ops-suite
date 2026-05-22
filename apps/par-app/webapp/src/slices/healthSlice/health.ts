// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { RootState } from "@slices/store";

interface MaintenanceState {
  maintenanceStatus: boolean;
  maintenanceMessage: string;
}

const initialState: MaintenanceState = {
  maintenanceStatus: false,
  maintenanceMessage: "",
};

const healthSlice = createSlice({
  name: "health",
  initialState,
  reducers: {
    setMaintenanceStatus: (
      state,
      action: PayloadAction<{
        maintenanceStatus: boolean;
        maintenanceMessage: string;
      }>,
    ) => {
      state.maintenanceStatus = action.payload.maintenanceStatus;
      state.maintenanceMessage = action.payload.maintenanceMessage;
    },
  },
});

export const { setMaintenanceStatus } = healthSlice.actions;
export const selectMaintenanceStatus = (state: RootState) => state.health.maintenanceStatus;
export default healthSlice.reducer;
