// src/slices/userSlice/index.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ApiService } from "../../utils/apiService";
import { appConfig } from "../../config/config";
import { RequestState } from "../../utils/types";

// 1. Define the Interface for the New Data Structure
export interface UserInfoInterface {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  jobRole: string;
  privileges: number[]; // <--- THIS IS THE KEY CHANGE (The Numbers)
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
      .get(appConfig.serviceUrls.userInfo || "/user-info") 
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
export const selectUserInfoData = (state: any) => state.user.userInfo; // Selector
export default UserSlice.reducer;
