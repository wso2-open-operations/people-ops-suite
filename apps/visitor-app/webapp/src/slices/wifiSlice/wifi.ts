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

export const fetchWifiDetails = createAsyncThunk<WifiInfo>(
  "wifi/fetchWifiDetails",
  (_, { dispatch, rejectWithValue }) => {
    return new Promise<WifiInfo>(async (resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.wifi, {})
        .then((response: any) => {
          resolve(response.data);
        })
        .catch((error: any) => {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === HttpStatusCode.Unauthorized) {
              dispatch(
                enqueueSnackbarMessage({
                  message: "You are not authorized to access WiFi details.",
                  type: "error",
                })
              );
            }
          }
          reject(rejectWithValue("Failed to fetch WiFi details"));
        });
    });
  }
);

export const wifiSlice = createSlice({
  name: "wifi",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWifiDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWifiDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.ssid = action.payload.ssid;
        state.password = action.payload.password;
      })
      .addCase(fetchWifiDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed to load WiFi details";
        state.ssid = "";
        state.password = "";
      });
  },
});

export default wifiSlice.reducer;
