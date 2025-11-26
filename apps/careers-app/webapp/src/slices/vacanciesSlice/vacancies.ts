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

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { HttpStatusCode } from "axios";
import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";
import { State } from "@/types/types";

export interface VacancyBasicInfo {
  id: number;
  title: string;
  publish_status: string;
  country: string[];
  job_type: string;
  team: string;
  published_on: string;
}

export interface VacancyDetail {
  id: number;
  title: string;
  designation: string;
  team: string;
  country: string[];
  job_type: string;
  allow_remote: boolean;
  office_locations: { [key: string]: string };
  publish_status: string;
  published_on: string | null;
  mainContent: string;
  taskInformation: string | null;
  additionalContent: string | null;
  similar_job_listing: VacancyBasicInfo[];
}

export interface OrgStructure {
  location_list: { [key: string]: string };
  team_list: { [key: string]: string };
}

interface VacanciesState {
  vacanciesState: State;
  vacanciesError: string | null;
  orgStructureState: State;
  orgStructureError: string | null;
  vacancies: VacancyBasicInfo[];
  orgStructure: OrgStructure | null;
  filteredVacancies: VacancyBasicInfo[];
  selectedLocations: string[];
  selectedTeams: string[];
  selectedVacancy: VacancyDetail | null;
  vacancyDetailState: State;
  vacancyDetailError: string | null;
}

const initialState: VacanciesState = {
  vacanciesState: State.idle,
  vacanciesError: null,
  orgStructureState: State.idle,
  orgStructureError: null,
  vacancies: [],
  orgStructure: null,
  filteredVacancies: [],
  selectedLocations: [],
  selectedTeams: [],
  selectedVacancy: null,
  vacancyDetailState: State.idle,
  vacancyDetailError: null,
};

export const fetchVacancies = createAsyncThunk(
  "vacancies/fetchVacancies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.vacancies}/basic-info`
      );
      return response.data as VacancyBasicInfo[];
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Failed to fetch vacancies. Please try again later."
          : error.response?.data?.message ||
            "An unknown error occurred while fetching vacancies.";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOrgStructure = createAsyncThunk(
  "vacancies/fetchOrgStructure",
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.orgStructure
      );
      return response.data as OrgStructure;
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Failed to fetch organization structure. Please try again later."
          : error.response?.data?.message ||
            "An unknown error occurred while fetching organization structure.";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchVacancyDetail = createAsyncThunk(
  "vacancies/fetchVacancyDetail",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.vacancies}/${id}`
      );
      return response.data as VacancyDetail;
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Failed to fetch vacancy details. Please try again later."
          : error.response?.data?.message ||
            "An unknown error occurred while fetching vacancy details.";
      return rejectWithValue(errorMessage);
    }
  }
);

const VacanciesSlice = createSlice({
  name: "vacancies",
  initialState,
  reducers: {
    setSelectedLocations: (state, action) => {
      state.selectedLocations = action.payload;
      applyFilters(state);
    },
    setSelectedTeams: (state, action) => {
      state.selectedTeams = action.payload;
      applyFilters(state);
    },
    clearFilters: (state) => {
      state.selectedLocations = [];
      state.selectedTeams = [];
      state.filteredVacancies = state.vacancies;
    },
    clearVacancyDetail: (state) => {
      state.selectedVacancy = null;
      state.vacancyDetailState = State.idle;
      state.vacancyDetailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVacancies.pending, (state) => {
        state.vacanciesState = State.loading;
        state.vacanciesError = null;
      })
      .addCase(fetchVacancies.fulfilled, (state, action) => {
        state.vacanciesState = State.success;
        state.vacancies = action.payload;
        state.filteredVacancies = action.payload;
        state.vacanciesError = null;
      })
      .addCase(fetchVacancies.rejected, (state, action) => {
        state.vacanciesState = State.failed;
        state.vacanciesError = action.payload as string;
      })
      .addCase(fetchOrgStructure.pending, (state) => {
        state.orgStructureState = State.loading;
        state.orgStructureError = null;
      })
      .addCase(fetchOrgStructure.fulfilled, (state, action) => {
        state.orgStructureState = State.success;
        state.orgStructure = action.payload;
        state.orgStructureError = null;
      })
      .addCase(fetchOrgStructure.rejected, (state, action) => {
        state.orgStructureState = State.failed;
        state.orgStructureError = action.payload as string;
      })
      .addCase(fetchVacancyDetail.pending, (state) => {
        state.vacancyDetailState = State.loading;
        state.vacancyDetailError = null;
      })
      .addCase(fetchVacancyDetail.fulfilled, (state, action) => {
        state.vacancyDetailState = State.success;
        state.selectedVacancy = action.payload;
        state.vacancyDetailError = null;
      })
      .addCase(fetchVacancyDetail.rejected, (state, action) => {
        state.vacancyDetailState = State.failed;
        state.vacancyDetailError = action.payload as string;
        state.selectedVacancy = null;
      });
  },
});

function applyFilters(state: VacanciesState) {
  let filtered = state.vacancies;

  if (state.selectedLocations.length > 0) {
    filtered = filtered.filter((vacancy) =>
      vacancy.country.some((location) =>
        state.selectedLocations.includes(location)
      )
    );
  }

  if (state.selectedTeams.length > 0) {
    filtered = filtered.filter((vacancy) =>
      state.selectedTeams.includes(vacancy.team)
    );
  }

  state.filteredVacancies = filtered;
}

export const { setSelectedLocations, setSelectedTeams, clearFilters, clearVacancyDetail } =
  VacanciesSlice.actions;

export default VacanciesSlice.reducer;
