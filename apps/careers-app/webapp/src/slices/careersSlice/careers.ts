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

import { PayloadAction, createAsyncThunk, createSlice, isRejected } from "@reduxjs/toolkit";

import {
  Application,
  ApplicationFeedback,
  CandidateProfile,
  EditableProfileFields,
  Job,
  OfferAnswer,
  State,
} from "@/types/types";
import {
  fetchApplications as fetchApplicationsApi,
  fetchProfile as fetchProfileApi,
  respondToOffer as respondToOfferApi,
  saveProfile as saveProfileApi,
  SESSION_EXPIRED_ERROR,
  submitFeedback as submitFeedbackApi,
} from "@utils/profileService";
import {
  OrgStructure,
  VacancyDetail,
  fetchOrgStructure,
  fetchVacancies,
  fetchVacancyDetail,
} from "@utils/vacancyService";

interface CareersState {
  profile: CandidateProfile;
  profileState: State;
  jobs: Job[];
  jobsState: State;
  jobDetails: Record<string, VacancyDetail>;
  orgStructure: OrgStructure;
  orgStructureState: State;
  applications: Application[];
  applicationsState: State;
  // Applications whose feedback request the candidate dismissed.
  dismissedFeedbackIds: string[];
  // True when the backend refused the access token, so the candidate has to sign in again.
  sessionExpired: boolean;
  savedJobIds: string[];
}

const isSessionExpired = (error: { name?: string }) => error.name === SESSION_EXPIRED_ERROR;

const emptyProfile: CandidateProfile = {
  firstName: "",
  lastName: "",
  gender: "",
  personalEmail: "",
  contactNo: "",
  address: null,
  university: null,
};

const initialState: CareersState = {
  profile: emptyProfile,
  profileState: State.idle,
  jobs: [],
  jobsState: State.idle,
  jobDetails: {},
  orgStructure: { locations: [], teams: [] },
  orgStructureState: State.idle,
  applications: [],
  applicationsState: State.idle,
  dismissedFeedbackIds: [],
  sessionExpired: false,
  // Save state is local/in-memory only -- not yet persisted to the backend,
  // so it resets on refresh.
  savedJobIds: [],
};

export const loadJobs = createAsyncThunk("careers/loadJobs", async (accessToken: string) => {
  return await fetchVacancies(accessToken);
});

export const loadOrgStructure = createAsyncThunk("careers/loadOrgStructure", async (accessToken: string) => {
  return await fetchOrgStructure(accessToken);
});

export const loadJobDetail = createAsyncThunk(
  "careers/loadJobDetail",
  async ({ accessToken, jobId }: { accessToken: string; jobId: string }) => {
    return await fetchVacancyDetail(jobId, accessToken);
  },
);

export const loadProfile = createAsyncThunk("careers/loadProfile", async (accessToken: string) => {
  return await fetchProfileApi(accessToken);
});

export const updateProfile = createAsyncThunk(
  "careers/updateProfile",
  async ({ accessToken, changes }: { accessToken: string; changes: Partial<EditableProfileFields> }) => {
    return await saveProfileApi(accessToken, changes);
  },
);

export const loadApplications = createAsyncThunk("careers/loadApplications", async (accessToken: string) => {
  return await fetchApplicationsApi(accessToken);
});

export const sendFeedback = createAsyncThunk(
  "careers/sendFeedback",
  async ({
    accessToken,
    applicationId,
    feedback,
  }: {
    accessToken: string;
    applicationId: string;
    feedback: ApplicationFeedback;
  }) => {
    await submitFeedbackApi(accessToken, applicationId, feedback);
  },
);

export const respondToOffer = createAsyncThunk(
  "careers/respondToOffer",
  async ({
    accessToken,
    applicationId,
    answer,
  }: {
    accessToken: string;
    applicationId: string;
    answer: OfferAnswer;
  }) => {
    return await respondToOfferApi(accessToken, applicationId, answer);
  },
);

export const CareersSlice = createSlice({
  name: "careers",
  initialState,
  reducers: {
    toggleSaveJob: (state, action: PayloadAction<string>) => {
      const idx = state.savedJobIds.indexOf(action.payload);
      if (idx >= 0) {
        state.savedJobIds.splice(idx, 1);
      } else {
        state.savedJobIds.push(action.payload);
      }
    },
    // Marks the jobs loads that never started as failed.
    loadFailed: (state) => {
      if (state.jobsState === State.idle) state.jobsState = State.failed;
      if (state.orgStructureState === State.idle) state.orgStructureState = State.failed;
    },
    // Puts failed jobs loads back to idle so they load again.
    retryLoad: (state) => {
      if (state.jobsState === State.failed) state.jobsState = State.idle;
      if (state.orgStructureState === State.failed) state.orgStructureState = State.idle;
    },
    // Marks the profile load as failed.
    profileFailed: (state) => {
      state.profileState = State.failed;
    },
    // Marks the applications load as failed.
    applicationsFailed: (state) => {
      state.applicationsState = State.failed;
    },
    // Puts a failed applications load back to idle so it loads again.
    retryApplications: (state) => {
      if (state.applicationsState === State.failed) state.applicationsState = State.idle;
    },
    // Marks the loaded applications as out of date, so they load again.
    refreshApplications: (state) => {
      if (state.applicationsState === State.success) state.applicationsState = State.idle;
    },
    // Remembers that the candidate dismissed the feedback request for an application.
    dismissFeedback: (state, action: PayloadAction<string>) => {
      if (!state.dismissedFeedbackIds.includes(action.payload)) state.dismissedFeedbackIds.push(action.payload);
    },
    // Clears the signed-in candidate's data.
    clearUserData: (state) => {
      state.profile = emptyProfile;
      state.profileState = State.idle;
      state.applications = [];
      state.applicationsState = State.idle;
      state.dismissedFeedbackIds = [];
      state.sessionExpired = false;
      state.savedJobIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadJobs.pending, (state) => {
        state.jobsState = State.loading;
      })
      .addCase(loadJobs.fulfilled, (state, action) => {
        state.jobs = action.payload;
        state.jobsState = State.success;
      })
      .addCase(loadJobs.rejected, (state) => {
        state.jobsState = State.failed;
      })
      .addCase(loadOrgStructure.pending, (state) => {
        state.orgStructureState = State.loading;
      })
      .addCase(loadOrgStructure.fulfilled, (state, action) => {
        state.orgStructure = action.payload;
        state.orgStructureState = State.success;
      })
      .addCase(loadOrgStructure.rejected, (state) => {
        state.orgStructureState = State.failed;
        state.orgStructure = { locations: [], teams: [] };
      })
      .addCase(loadJobDetail.fulfilled, (state, action) => {
        state.jobDetails[action.payload.id] = action.payload;
      })
      .addCase(loadProfile.pending, (state) => {
        state.profileState = State.loading;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.profileState = State.success;
      })
      .addCase(loadProfile.rejected, (state) => {
        state.profileState = State.failed;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(loadApplications.pending, (state) => {
        state.applicationsState = State.loading;
      })
      .addCase(loadApplications.fulfilled, (state, action) => {
        state.applications = action.payload;
        state.applicationsState = State.success;
      })
      .addCase(loadApplications.rejected, (state) => {
        state.applicationsState = State.failed;
      })
      .addCase(sendFeedback.fulfilled, (state, action) => {
        const application = state.applications.find((a) => a.id === action.meta.arg.applicationId);
        if (application) application.feedbackSubmitted = true;
      })
      .addCase(respondToOffer.fulfilled, (state, action) => {
        const index = state.applications.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) state.applications[index] = action.payload;
      })
      // Any signed-in request the backend refuses with a 401 asks the user to sign in again.
      .addMatcher(
        isRejected(loadProfile, updateProfile, loadApplications, sendFeedback, respondToOffer),
        (state, action) => {
          if (isSessionExpired(action.error)) state.sessionExpired = true;
        },
      );
  },
});

export const {
  toggleSaveJob,
  loadFailed,
  retryLoad,
  profileFailed,
  applicationsFailed,
  retryApplications,
  refreshApplications,
  dismissFeedback,
  clearUserData,
} = CareersSlice.actions;
export default CareersSlice.reducer;
