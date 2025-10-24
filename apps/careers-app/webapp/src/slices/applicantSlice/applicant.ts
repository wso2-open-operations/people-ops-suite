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
export interface ApplicantPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  status: string;
  professional_links: { title: string; link: string }[];
  educations: {
    degree: string;
    institution: string;
    location: string;
    gpa_zscore: number;
    start_year: number;
    end_year: number | null;
  }[];
  experiences: {
    job_title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string | null;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issued_by: string;
    year: number;
    link: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    github: string;
  }[];
  languages: {
    language: string;
    proficiency: string;
  }[];
  interests: string[];
  base64_profile_photo?: string;
  profile_photo_file_name?: string;
  base64_cv?: string;
  cv_file_name?: string;
}

interface ApplicantState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
}

const initialState: ApplicantState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
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

const ApplicantSlice = createSlice({
  name: "applicant",
  initialState,
  reducers: {},
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
      });
  },
});

export default ApplicantSlice.reducer;
