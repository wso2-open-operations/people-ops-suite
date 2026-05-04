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
import { type PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosError } from "axios";

import { AppConfig } from "@config/config";
import { getAPIService } from "@utils/apiService";

import { State } from "../../types/types";

export interface UserInfoInterface {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  jobRole: string;
  privileges: number[];
}

export interface UserState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  userInfo: UserInfoInterface | null;
}

const initialState: UserState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  userInfo: null,
};

export const getUserInfo = createAsyncThunk<{ UserInfo: UserInfoInterface }>(
  "user/getUserInfo",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getAPIService().get(AppConfig.serviceUrls.userInfo);
      return {
        UserInfo: resp.data,
      };
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue({
        code: err.code,
        message: err.message,
        status: err.response?.status,
      });
    }
  },
);

export const UserSlice = createSlice({
  name: "getUserInfo",
  initialState,
  reducers: {
    updateStateMessage: (state, action: PayloadAction<string>) => {
      state.stateMessage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserInfo.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Checking User Info...";
        state.errorMessage = null;
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.userInfo = action.payload.UserInfo;
        state.state = State.success;
        state.stateMessage = null;
        state.errorMessage = null;
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.state = State.failed;
        state.userInfo = null;
        state.stateMessage = null;
        const errorPayload = action.payload as { status?: number } | undefined;
        const errorStatus = errorPayload?.status;

        if (errorStatus === 401 || errorStatus === 403) {
          state.errorMessage =
            "Oops! Looks like you are not authorized to access this application.";
        } else {
          state.errorMessage = "Something went wrong while authenticating the user.";
        }
      });
  },
});

export const { updateStateMessage } = UserSlice.actions;

export default UserSlice.reducer;
