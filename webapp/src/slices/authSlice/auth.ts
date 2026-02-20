// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { UserState } from "@slices/userSlice/user";
import {
  Role,
  AuthState,
  AuthData,
  AuthFlowState,
  RequestState,
} from "@utils/types";


const initialState: AuthState = {
  isAuthenticated: false,
  status: RequestState.IDLE,
  statusMessage: null,
  userInfo: null,
  accessToken: null,
  isIdTokenExpired: null,
  decodedIdToken: null,
  roles: [],
  userPrivileges: null,
  errorMessage: null,
  authFlowState: "start",
  userEmail: null,
  employeeInfoStatus: RequestState.IDLE,
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
    setStatus: (state, action: PayloadAction<AuthState["status"]>) => {
      state.status = action.payload;
    },
    setStatusMessage: (state, action: PayloadAction<string | null>) => {
      state.statusMessage = action.payload;
    },
    setTokenState: (state) => {
      state.isIdTokenExpired = true;
    },
    setAuthFlowState: (state, action: PayloadAction<AuthFlowState>) => {
      state.authFlowState = action.payload;
    },
    setErrorMessage: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
    },
    checkTokenState: (state) => {
      state.isIdTokenExpired = state.decodedIdToken
        ? Date.now() >= state.decodedIdToken?.exp * 1000
        : null;
    },
    resetStates: (state) => {
      state = {
        isAuthenticated: false,
        status: RequestState.IDLE,
        statusMessage: null,
        userInfo: null,
        accessToken: null,
        isIdTokenExpired: null,
        decodedIdToken: null,
        roles: [],
        userPrivileges: null,
        errorMessage: null,
        authFlowState: "start",
        employeeInfoStatus: RequestState.IDLE,
        employeeInfo: null,
        userEmail: null,
      };
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
    // Get the data fetched by the UserSlice
    const { userInfo, state } = (getState() as RootState).user as UserState;

    if (state === RequestState.FAILED || !userInfo) {
      return rejectWithValue("User info not found");
    }

    const userPrivileges = userInfo.privileges || [];
    const roles: Role[] = [];

    if (userPrivileges.includes(762)) {
      roles.push(Role.ADMIN);
    }
    if (userPrivileges.includes(987)) {
      roles.push(Role.EMPLOYEE);
    }
    if (userPrivileges.includes(777)) {
      roles.push(Role.TEAM_LEAD);
    }
    if (roles.length === 0) {
      return rejectWithValue("No valid roles found");
    }

    return { roles };
  }
);

// export const loadPrivileges = createAsyncThunk(
//   "auth/loadPrivileges",
//   async () => {
//     return getUserPrivileges();
//   }
// );

// export const loadEmployeeInfo = createAsyncThunk(
//   "auth/loadEmployeeInfo",
//   async (userEmail: string) => {
//     return getEmployeeInfo(userEmail);
//   }
// );

export const {
  setUserAuthData,
  setStatus,
  setStatusMessage,
  checkTokenState,
  setTokenState,
  resetStates,
  setAuthFlowState,
  setErrorMessage,
} = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectUserInfo = (state: RootState) => state.auth.userInfo;
export const selectIdToken = (state: RootState) => state.auth.accessToken;
export const selectUserEmail = (state: RootState) =>
  state.auth.userEmail || null;
export const selectEmployeeInfo = (state: RootState) => state.auth.employeeInfo;

export const selectStatus = (state: RootState) => state.auth.status;
export const selectRoles = (state: RootState) => state.auth.roles;
export const selectStatusMessage = (state: RootState) =>
  state.auth.statusMessage;
export const isIdTokenExpired = (state: RootState) =>
  state.auth.isIdTokenExpired;
export const selectEmployeeInfoStatus = (state: RootState) =>
  state.auth.employeeInfoStatus;

export default authSlice.reducer;
