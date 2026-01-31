// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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
      }>
    ) => {
      state.maintenanceStatus = action.payload.maintenanceStatus;
      state.maintenanceMessage = action.payload.maintenanceMessage;
    },
  },
});

export const { setMaintenanceStatus } = healthSlice.actions;
export const createSetMaintenanceStatusAction = (
  maintenanceStatus: boolean,
  maintenanceMessage: string
) =>
  healthSlice.actions.setMaintenanceStatus({
    maintenanceStatus,
    maintenanceMessage,
  });

export const selectMaintenanceStatus = (state: RootState) =>
  state.health.maintenanceStatus;
export const selectMaintenanceMessage = (state: RootState) =>
  state.health.maintenanceMessage;
export default healthSlice.reducer;
