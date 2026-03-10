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

import axios, { HttpStatusCode } from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { APIService } from "@utils/apiService";
import { AppConfig } from "@config/config";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

interface WifiInfo {
  ssid: string;
  password: string;
  loading: boolean;
  error: string | null;
}

const initialState: WifiInfo = {
  ssid: "",
  password: "",
  loading: false,
  error: null,
};

export const createWifiAccount = createAsyncThunk<WifiInfo, string>(
  "wifi/createWifiAccount",
  async (username, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.wifi,
        null,
        {
          params: {
            username,
          },
        },
      );

      return {
        ssid: response.data.username,
        password: response.data.password,
        loading: false,
        error: null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === HttpStatusCode.Unauthorized) {
          dispatch(
            enqueueSnackbarMessage({
              message: "You are not authorized to create WiFi accounts.",
              type: "error",
            }),
          );
        }
      }
      return rejectWithValue("Failed to create WiFi account");
    }
  },
);

export const wifiSlice = createSlice({
  name: "wifi",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createWifiAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWifiAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.ssid = action.payload.ssid;
        state.password = action.payload.password;
      })
      .addCase(createWifiAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed to create WiFi account";
        state.ssid = "";
        state.password = "";
      });
  },
});

export default wifiSlice.reducer;
