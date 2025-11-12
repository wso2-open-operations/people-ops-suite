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

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { APIService } from "@utils/apiService";
import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import { HttpStatusCode } from "axios";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

export interface BusinessUnit {
  id: number;
  name: string;
  head_email?: string;
  is_active?: boolean;
}

export interface Team {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface SubTeam {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface Unit {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface CareerFunction {
  id: number;
  careerFunction: string;
}

export interface Designation {
  id: number;
  designation: string;
  jobBand: number;
}

export interface Office {
  id: number;
  name: string;
  location: string;
  workingLocations: string[];
}

export interface OrganizationState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  businessUnits: BusinessUnit[];
  teams: Team[];
  subTeams: SubTeam[];
  units: Unit[];
  careerFunctions: CareerFunction[];
  designations: Designation[];
  offices: Office[];
}

const initialState: OrganizationState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  businessUnits: [],
  teams: [],
  subTeams: [],
  units: [],
  careerFunctions: [],
  designations: [],
  offices: [],
};

interface FetchParams {
  id?: number;
}

interface FetchDesignationsParams {
  careerFunctionId?: number;
}
// Fetch Business Units
export const fetchBusinessUnits = createAsyncThunk(
  "organization/fetchBusinessUnits",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.businessUnits}`
      );
      return resp.data as BusinessUnit[];
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching business units"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching business units.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch Teams
export const fetchTeams = createAsyncThunk(
  "organization/fetchTeams",
  async ({ id: buId }: FetchParams = {}, { dispatch, rejectWithValue }) => {
    try {
      const url = buId
        ? `${AppConfig.serviceUrls.teams}?buId=${buId}`
        : `${AppConfig.serviceUrls.teams}`;
      const resp = await APIService.getInstance().get(url);
      return resp.data as Team[];
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching teams"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching teams.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch Sub Teams
export const fetchSubTeams = createAsyncThunk(
  "organization/fetchSubTeams",
  async ({ id: teamId }: FetchParams = {}, { dispatch, rejectWithValue }) => {
    try {
      const url = teamId
        ? `${AppConfig.serviceUrls.subTeams}?teamId=${teamId}`
        : `${AppConfig.serviceUrls.subTeams}`;
      const resp = await APIService.getInstance().get(url);
      return resp.data as SubTeam[];
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching sub teams"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching sub teams.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch Units
export const fetchUnits = createAsyncThunk(
  "organization/fetchUnits",
  async (
    { id: subTeamId }: FetchParams = {},
    { dispatch, rejectWithValue }
  ) => {
    try {
      const url = subTeamId
        ? `${AppConfig.serviceUrls.units}?subTeamId=${subTeamId}`
        : `${AppConfig.serviceUrls.units}`;
      const resp = await APIService.getInstance().get(url);
      return resp.data as Unit[];
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching units"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching units.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch Career Functions
export const fetchCareerFunctions = createAsyncThunk(
  "organization/fetchCareerFunctions",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.careerFunctions}`
      );
      if (!Array.isArray(resp.data)) {
        throw new Error(
          "Invalid response: career functions should be an array"
        );
      }
      return resp.data as CareerFunction[];
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching career functions"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching career functions.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch Designations
export const fetchDesignations = createAsyncThunk(
  "organization/fetchDesignations",
  async (
    { careerFunctionId }: FetchDesignationsParams = {},
    { dispatch, rejectWithValue }
  ) => {
    try {
      const url = careerFunctionId
        ? `${AppConfig.serviceUrls.designations}?careerFunctionId=${careerFunctionId}`
        : `${AppConfig.serviceUrls.designations}`;
      const resp = await APIService.getInstance().get(url);
      if (!Array.isArray(resp.data)) {
        throw new Error("Invalid response: designations should be an array");
      }
      return resp.data as Designation[];
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching designations"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching designations.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch Offices
export const fetchOffices = createAsyncThunk(
  "organization/fetchOffices",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.offices}`
      );
      if (!Array.isArray(resp.data)) {
        throw new Error("Invalid response: offices should be an array");
      }
      const offices: Office[] = resp.data.map((office: any) => ({
        id: office.id,
        name: office.name,
        location: office.location,
        workingLocations: Array.isArray(office.workingLocations)
          ? office.workingLocations
          : [],
      }));
      return offices;
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching offices"
          : error.response?.data?.message ||
            error.message ||
            "Failed to fetch offices.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
  }
);

export const organizationSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    updateStateMessage: (state, action: PayloadAction<string | null>) => {
      state.stateMessage = action.payload;
    },
    resetState: (state) => {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
      state.businessUnits = [];
      state.teams = [];
      state.subTeams = [];
      state.units = [];
      state.careerFunctions = [];
      state.designations = [];
      state.offices = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusinessUnits.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching business units...";
        state.errorMessage = null;
      })
      .addCase(fetchBusinessUnits.fulfilled, (state, action) => {
        state.businessUnits = action.payload;
        state.state = State.success;
        state.stateMessage = "Business units fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchBusinessUnits.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(fetchTeams.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching teams...";
        state.errorMessage = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.state = State.success;
        state.stateMessage = "Teams fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(fetchSubTeams.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching sub teams...";
        state.errorMessage = null;
      })
      .addCase(fetchSubTeams.fulfilled, (state, action) => {
        state.subTeams = action.payload;
        state.state = State.success;
        state.stateMessage = "Sub teams fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchSubTeams.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(fetchUnits.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching units...";
        state.errorMessage = null;
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.units = action.payload;
        state.state = State.success;
        state.stateMessage = "Units fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(fetchCareerFunctions.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching career functions...";
        state.errorMessage = null;
      })
      .addCase(fetchCareerFunctions.fulfilled, (state, action) => {
        state.careerFunctions = action.payload;
        state.state = State.success;
        state.stateMessage = "Career functions fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchCareerFunctions.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(fetchDesignations.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching designations...";
        state.errorMessage = null;
      })
      .addCase(fetchDesignations.fulfilled, (state, action) => {
        state.designations = action.payload;
        state.state = State.success;
        state.stateMessage = "Designations fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchDesignations.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(fetchOffices.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching offices...";
        state.errorMessage = null;
      })
      .addCase(fetchOffices.fulfilled, (state, action) => {
        state.offices = action.payload;
        state.state = State.success;
        state.stateMessage = "Offices fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchOffices.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      });
  },
});

export const { updateStateMessage, resetState } = organizationSlice.actions;
export default organizationSlice.reducer;
