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
import { AxiosError } from "axios";

import { AppConfig } from "@config/config";
import { getAPIService } from "@utils/apiService";

export interface Advertisement {
  id: string;
  adName: string;
  mediaUrl: string;
  mediaType: string;
  duration: number;
  isActive: boolean;
  uploadedDate: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number;
  lastDisplayedAt?: string;
}

interface AdvertisementState {
  state: "idle" | "loading" | "success" | "failed";
  advertisements: Advertisement[];
  activeAdId: string | null;
  errorMessage: string | null;
}

const initialState: AdvertisementState = {
  state: "idle",
  advertisements: [],
  activeAdId: null,
  errorMessage: null,
};

const mapAdvertisement = (item: {
  id: number;
  adName: string;
  mediaUrl: string;
  mediaType: string;
  durationSeconds: number;
  isActive: boolean;
  uploadedDate: string;
  scheduleEnabled?: boolean;
  scheduleIntervalMinutes?: number;
  lastDisplayedAt?: string;
}): Advertisement => ({
  id: String(item.id),
  adName: item.adName,
  mediaUrl: item.mediaUrl,
  mediaType: item.mediaType,
  duration: item.durationSeconds,
  isActive: item.isActive,
  uploadedDate: item.uploadedDate,
  scheduleEnabled: item.scheduleEnabled ?? false,
  scheduleIntervalMinutes: item.scheduleIntervalMinutes ?? 5,
  lastDisplayedAt: item.lastDisplayedAt,
});

export const fetchAdvertisements = createAsyncThunk(
  "advertisement/fetchAdvertisements",
  async (_, { rejectWithValue }) => {
    try {
      const [listResult, activeResult] = await Promise.allSettled([
        getAPIService().get(AppConfig.serviceUrls.advertisements),
        getAPIService().get(AppConfig.serviceUrls.advertisementsActive),
      ]);

      if (listResult.status !== "fulfilled") {
        throw listResult.reason;
      }

      const list = listResult.value.data as Array<{
        id: number;
        adName: string;
        mediaUrl: string;
        mediaType: string;
        durationSeconds: number;
        isActive: boolean;
        uploadedDate: string;
        scheduleEnabled?: boolean;
        scheduleIntervalMinutes?: number;
        lastDisplayedAt?: string;
      }>;

      const active =
        activeResult.status === "fulfilled"
          ? (activeResult.value.data as { id: number } | null)
          : null;

      return {
        advertisements: list.map((item) =>
          mapAdvertisement({
            ...item,
            isActive: active?.id === item.id,
          }),
        ),
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

export const addAdvertisement = createAsyncThunk(
  "advertisement/addAdvertisement",
  async (
    payload: {
      adName: string;
      mediaUrl: string;
      mediaType: string;
      durationSeconds: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await getAPIService().post(AppConfig.serviceUrls.advertisements, payload);
      return response.data;
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

export const activateAdvertisement = createAsyncThunk(
  "advertisement/activateAdvertisement",
  async (adId: string, { rejectWithValue }) => {
    try {
      await getAPIService().put(`${AppConfig.serviceUrls.advertisements}/${adId}/activate`);
      return { adId };
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

export const deactivateAdvertisement = createAsyncThunk(
  "advertisement/deactivateAdvertisement",
  async (adId: string, { rejectWithValue }) => {
    try {
      await getAPIService().put(`${AppConfig.serviceUrls.advertisements}/${adId}/deactivate`);
      return { adId };
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

export const deleteAdvertisement = createAsyncThunk(
  "advertisement/deleteAdvertisement",
  async (adId: string, { rejectWithValue }) => {
    try {
      await getAPIService().delete(`${AppConfig.serviceUrls.advertisements}/${adId}`);
      return { adId };
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

const advertisementSlice = createSlice({
  name: "advertisement",
  initialState,
  reducers: {
    clearErrorMessage: (state) => {
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdvertisements.pending, (state) => {
        state.state = "loading";
        state.errorMessage = null;
      })
      .addCase(fetchAdvertisements.fulfilled, (state, action) => {
        state.state = "success";
        state.advertisements = action.payload.advertisements;
        state.errorMessage = null;
      })
      .addCase(fetchAdvertisements.rejected, (state, action) => {
        state.state = "failed";
        const payload = action.payload as { status?: number } | undefined;
        state.errorMessage =
          payload?.status === 401 || payload?.status === 403
            ? "Unauthorized to fetch advertisements"
            : "Failed to load advertisements";
      })
      .addCase(addAdvertisement.fulfilled, (state) => {
        state.state = "success";
      })
      .addCase(activateAdvertisement.fulfilled, (state, action) => {
        state.advertisements = state.advertisements.map((ad) => ({
          ...ad,
          isActive: ad.id === action.payload.adId,
        }));
      })
      .addCase(deactivateAdvertisement.fulfilled, (state, action) => {
        state.advertisements = state.advertisements.map((ad) => ({
          ...ad,
          isActive: ad.id === action.payload.adId ? false : ad.isActive,
        }));
      })
      .addCase(deleteAdvertisement.fulfilled, (state, action) => {
        state.advertisements = state.advertisements.filter((ad) => ad.id !== action.payload.adId);
      });
  },
});

export const { clearErrorMessage } = advertisementSlice.actions;
export default advertisementSlice.reducer;
