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

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import axios, { HttpStatusCode } from "axios";
import { APIService } from "@utils/apiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { SnackMessage } from "@config/constant";

export interface Educations{
  degree: string;
  institution: string;
  location: string;
  gpa_zscore: number;
  start_year: number;
  end_year: number | null;
}
export interface Experiences{
  job_title: string;
  company: string;
  location: string;
  start_date: string;
  end_date?: string;
  current?: boolean;
}
export interface Certifications{
  name: string;
  issued_by: string;
  year: number;
  link: string;
}
export interface Projects{
  name: string;
  description: string;
  technologies: string[];
  github: string;
}
export interface Languages{
  language: string;
  proficiency: string;
}
export interface ApplicantPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  status: string;
  professional_links: { title: string; link: string }[];
  educations: Educations[];
  experiences: Experiences[];
  skills: string[];
  certifications: Certifications[];
  projects: Projects[];
  languages: Languages[];
  interests: string[];
  profile_photo_file_name?: string;
  cv_file_name?: string;
}
export interface ApplicantProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  status: string;
  user_thumbnail?: number[]; 
  resume_link?: number[]; 
  professional_links?: { title: string; link: string }[];
  educations?: Educations[];
  experiences?: Experiences[];
  certifications?: Certifications[];
  projects?: Projects[];
  languages?: Languages[];
  skills?: string[];
  interests?: string[];
}

interface ApplicantState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  applicantProfile: ApplicantProfile | null;
}

const initialState: ApplicantState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  applicantProfile: null,
};

export const createApplicant = createAsyncThunk(
  "applicant/createApplicant",
  async (payload: ApplicantPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.applicants,
        payload
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.applicantCreate,
          type: "success",
        })
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              error.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.applicantCreate
                : error.response?.data?.message || SnackMessage.error.applicantUnknown,
            type: "error",
          })
        );
      }
      return rejectWithValue(error.message);
    }
  }
);

export const fetchApplicantByEmail = createAsyncThunk(
  "applicant/fetchApplicantByEmail",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.applicants}/${encodeURIComponent(email)}`
      );
      return response.data as ApplicantProfile;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return rejectWithValue("not-found");
        }
        return rejectWithValue(error.response?.data?.message || "Unknown error");
      }
      return rejectWithValue("Unexpected error");
    }
  }
);

export const updateApplicant = createAsyncThunk(
  "applicant/updateApplicant",
  async (
    { email, payload }: { email: string; payload: Partial<ApplicantPayload> },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await APIService.getInstance().patch(
        `${AppConfig.serviceUrls.applicants}/${encodeURIComponent(email)}`,
        payload
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.applicantUpdate,
          type: "success",
        })
      );
      return response.data as ApplicantProfile;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              error.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.applicantUpdate
                : error.response?.data?.message || SnackMessage.error.applicantUnknown,
            type: "error",
          })
        );
      }
      return rejectWithValue(error.message);
    }
  }
);

const ApplicantSlice = createSlice({
  name: "applicant",
  initialState,
  reducers: {
    resetApplicantState: (state) => {
      state.state = State.idle;
      state.errorMessage = null;
      state.stateMessage = null;
    },
    resetApplicantProfile: (state) => {
      state.applicantProfile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createApplicant.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Creating applicant...";
      })
      .addCase(createApplicant.fulfilled, (state) => {
        state.state = State.success;
        state.stateMessage = "Applicant created!";
      })
      .addCase(createApplicant.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
      })
      .addCase(fetchApplicantByEmail.pending, (state) => {
        state.state = State.loading;
        state.applicantProfile = null;
      })
      .addCase(fetchApplicantByEmail.fulfilled, (state, action) => {
        state.state = State.success;
        state.applicantProfile = action.payload;
      })
      .addCase(fetchApplicantByEmail.rejected, (state, action) => {
        if (action.payload === "not-found") {
          state.state = State.success;
          state.applicantProfile = null;
        } else {
          state.state = State.failed;
          state.errorMessage = action.payload as string;
        }
      })
      .addCase(updateApplicant.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Updating applicant...";
      })
      .addCase(updateApplicant.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Applicant updated!";
        state.applicantProfile = action.payload;
      })
      .addCase(updateApplicant.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
      });
  },
});

export const { resetApplicantState, resetApplicantProfile } =
  ApplicantSlice.actions;
  
export default ApplicantSlice.reducer;
