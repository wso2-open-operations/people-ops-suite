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
import { BasicUserInfo, DecodedIDTokenPayload } from "@asgardeo/auth-spa";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { State as LegacyState } from "@/types/types";
import {
  ADMIN_PRIVILEGE,
  LEAD_PRIVILEGE,
  SERVICE_DESK_PRIVILEGE,
  SnackMessage,
} from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState } from "@slices/store";

export enum Role {
  EMPLOYEE = "EMPLOYEE",
  LEAD = "LEAD",
  ADMIN = "ADMIN",
  SERVICE_DESK = "SERVICE_DESK",
}
export interface UserState {
  state: LegacyState;
  stateMessage: string | null;
  errorMessage: string | null;
  userInfo: UserInfoInterface | null;
  isProfileMissing: boolean;
}

export interface UserInfoInterface {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  jobRole: string;
  privileges: number[];
}

enum AuthMode {
  Active = "ACTIVE",
  Maintenance = "MAINTENANCE",
}

export enum State {
  Failed = "FAILED",
  Success = "SUCCESS",
  Loading = "LOADING",
  Idle = "IDLE",
}

export interface ExtendedDecodedIDTokenPayload extends DecodedIDTokenPayload {
  groups?: string[];
}

export interface AuthState {
  status: LegacyState;
  mode: AuthMode;
  statusMessage: string | null;
  userInfo: BasicUserInfo | null;
  decodedIdToken: ExtendedDecodedIDTokenPayload | null;
  roles: Role[];
}

export interface AuthData {
  userInfo: BasicUserInfo;
  decodedIdToken: ExtendedDecodedIDTokenPayload;
}

const initialState: AuthState = {
  status: LegacyState.idle,
  mode: AuthMode.Active,
  statusMessage: null,
  userInfo: null,
  decodedIdToken: null,
  roles: [],
};

export const loadPrivileges = createAsyncThunk(
  "auth/loadPrivileges",
  (_, { getState, dispatch, rejectWithValue }) => {
    const { userInfo, state, errorMessage } = (getState() as { user: UserState }).user;

    if (state === LegacyState.failed) {
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.error.fetchPrivileges,
          type: "error",
        }),
      );
      return rejectWithValue(errorMessage);
    }
    const userPrivileges = userInfo?.privileges || [];
    const roles: Role[] = [Role.EMPLOYEE];

    if (userPrivileges.includes(LEAD_PRIVILEGE)) {
      roles.push(Role.LEAD);
    }
    if (userPrivileges.includes(ADMIN_PRIVILEGE)) {
      roles.push(Role.ADMIN);
    }
    if (userPrivileges.includes(SERVICE_DESK_PRIVILEGE)) {
      roles.push(Role.SERVICE_DESK);
    }
    return { roles };
  },
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserAuthData: (state, action: PayloadAction<AuthData>) => {
      state.userInfo = action.payload.userInfo;
      state.decodedIdToken = action.payload.decodedIdToken;
      state.status = LegacyState.success;
    },
    setAuthError: (state) => {
      state.status = LegacyState.failed;
      state.userInfo = null;
      state.decodedIdToken = null;
      state.roles = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPrivileges.pending, (state) => {
        state.status = LegacyState.loading;
      })
      .addCase(loadPrivileges.fulfilled, (state, action) => {
        state.status = LegacyState.success;
        state.roles = action.payload.roles;
      })
      .addCase(loadPrivileges.rejected, (state, action) => {
        state.status = LegacyState.failed;
        state.statusMessage = action.payload as string;
      });
  },
});

export const { setUserAuthData, setAuthError } = authSlice.actions;
export const selectRoles = (state: RootState) => state.auth.roles;
export default authSlice.reducer;
