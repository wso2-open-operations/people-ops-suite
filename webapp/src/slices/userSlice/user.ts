// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ApiService } from "../../utils/apiService";
import { AppConfig } from "../../config/config";
import { RequestState } from "../../utils/types";

export interface UserInfoInterface {
  employeeId: string;
  employeeName: string; // Backend sends "employeeName" (combined)
  firstName?: string;   // Optional if backend doesn't send split names
  lastName?: string;
  workEmail: string;
  employeeThumbnail: string | null;
  startDate?: string;
  jobRole: string;
  businessUnit?: string;
  department?: string;
  team?: string;
  location?: string;
  isTeamLead: boolean;
  leadEmail?: string | null;
  privileges: number[];
}

export interface UserState {
  state: RequestState;
  stateMessage: string | null;
  errorMessage: string | null;
  userInfo: UserInfoInterface | null;
}

const initialState: UserState = {
  state: RequestState.IDLE,
  stateMessage: null,
  errorMessage: null,
  userInfo: null,
};

// 2. The Thunk to fetch User Info (including the numbers)
export const getUserInfo = createAsyncThunk("user/getUserInfo", async () => {
  return new Promise<{ UserInfo: UserInfoInterface }>((resolve, reject) => {
    // Assuming 'userInfo' is the endpoint in your config
    ApiService.getInstance()
      .get(AppConfig.serviceUrls.userInfo || "/user-info") 
      .then((resp) => {
        resolve({ UserInfo: resp.data });
      })
      .catch((error) => {
        reject(error);
      });
  });
});

export const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateStateMessage: (state, action: PayloadAction<string>) => {
      state.stateMessage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserInfo.pending, (state) => {
        state.state = RequestState.LOADING;
        state.stateMessage = "Checking User Info...";
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.userInfo = action.payload.UserInfo;
        state.state = RequestState.SUCCEEDED;
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.state = RequestState.FAILED;
        state.errorMessage = "Failed to fetch user info.";
      });
  },
});

export const { updateStateMessage } = UserSlice.actions;
export const selectUserInfoData = (state: any) => state.user.userInfo;
export default UserSlice.reducer;
