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

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { AuthData, AuthState, RequestState, Role } from "@utils/types";

import { RootState } from "../store";
import { UserState } from "../userSlice/user";

const initialState: AuthState = {
  isAuthenticated: false,
  status: RequestState.IDLE,
  mode: "active",
  statusMessage: null,
  userInfo: null,
  accessToken: null,
  decodedIdToken: null,
  roles: [],
  errorMessage: null,
  userEmail: null,
  employeeInfo: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserAuthData: (state, action: PayloadAction<AuthData>) => {
      state.userInfo = action.payload.userInfo;
      state.accessToken = action.payload.accessToken;
      state.decodedIdToken = action.payload.decodedIdToken;
      state.userEmail = action.payload.decodedIdToken?.email || null;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload;
      state.isAuthenticated = false;
      state.status = RequestState.FAILED;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadPrivileges.fulfilled, (state, action) => {
        state.roles = action.payload.roles;
        state.isAuthenticated = true;
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(loadPrivileges.rejected, (state, action) => {
        state.status = RequestState.FAILED;
        state.isAuthenticated = false;
        state.errorMessage = action.payload as string;
      });
  },
});

export const loadPrivileges = createAsyncThunk(
  "auth/loadPrivileges",
  (_, { getState, rejectWithValue }) => {
    const { userInfo, state } = (getState() as RootState).user as UserState;

    if (state === RequestState.FAILED || !userInfo) {
      return rejectWithValue("User info not found");
    }

    const userPrivileges = userInfo.privileges || [];
    const roles: Role[] = [];

    if (userPrivileges.includes(762)) roles.push(Role.ADMIN);
    if (userPrivileges.includes(987)) roles.push(Role.EMPLOYEE);
    if (userPrivileges.includes(777)) roles.push(Role.TEAM_LEAD);
    if (userInfo.lead) roles.push(Role.LEAD);

    if (roles.length === 0) {
      return rejectWithValue("No valid roles found");
    }

    return { roles };
  },
);

export const { setUserAuthData, setAuthError } = authSlice.actions;

export const selectUserInfo = (state: RootState) => state.auth.userInfo;
export const selectIdToken = (state: RootState) => state.auth.accessToken;
export const selectUserEmail = (state: RootState) => state.auth.userEmail || null;
export const selectEmployeeInfo = (state: RootState) => state.auth.employeeInfo;
export const selectRoles = (state: RootState) => state.auth.roles;

export default authSlice.reducer;
