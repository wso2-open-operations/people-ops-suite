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

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError, isCancel } from "axios";
import { APIService } from "@utils/apiService";
import { AppConfig } from "@config/config";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { State } from "@/types/types";

export interface LeadershipGroup {
  id: number;
  name: string;
  isActive: boolean;
}

interface LeadershipState {
  groups: LeadershipGroup[];
  state: State;
}

const initialState: LeadershipState = {
  groups: [],
  state: State.idle,
};

export const fetchLeadershipGroups = createAsyncThunk(
  "leadership/fetchLeadershipGroups",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().get(
        AppConfig.serviceUrls.leadershipGroups,
      );
      if (!Array.isArray(resp.data)) {
        throw new Error(
          "Invalid response: leadership attributes should be an array",
        );
      }
      return resp.data as LeadershipGroup[];
    } catch (error: unknown) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage = isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : "Error fetching leadership attributes";
      dispatch(enqueueSnackbarMessage({ message: errorMessage, type: "error" }));
      return rejectWithValue(errorMessage);
    }
  },
);

const leadershipSlice = createSlice({
  name: "leadership",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadershipGroups.pending, (state) => {
        state.state = State.loading;
      })
      .addCase(fetchLeadershipGroups.fulfilled, (state, action) => {
        state.state = State.success;
        state.groups = action.payload;
      })
      .addCase(fetchLeadershipGroups.rejected, (state) => {
        state.state = State.failed;
      });
  },
});

export default leadershipSlice.reducer;
