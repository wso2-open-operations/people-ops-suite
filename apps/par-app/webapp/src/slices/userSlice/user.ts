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

import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { AppConfig } from "@config/config";

import { RootState } from "@slices/store";

import { ApiService } from "@utils/apiService";
import { RequestState } from "@utils/types";

export interface UserInfoInterface {
  employeeId: string;
  employeeName: string;
  firstName?: string;
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
  lead: boolean | null;
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

export const getUserInfo = createAsyncThunk("user/getUserInfo", async () => {
  const resp = await ApiService.getInstance().get(AppConfig.serviceUrls.userInfo || "/user-info");
  return { UserInfo: resp.data as UserInfoInterface };
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
        state.stateMessage = null;
      })
      .addCase(getUserInfo.rejected, (state) => {
        state.state = RequestState.FAILED;
        state.stateMessage = null;
        state.errorMessage = "Failed to fetch user info.";
      });
  },
});

export const { updateStateMessage } = UserSlice.actions;
export const selectUserInfoData = (state: RootState) => state.user.userInfo;
export default UserSlice.reducer;
