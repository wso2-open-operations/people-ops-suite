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
import { configureStore } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import authReducer from "@slices/authSlice/auth";
import calendarSlice from "@slices/calendarSlice/calendar";
import collectionReducer from "@slices/collections/collection";
import commonReducer from "@slices/commonSlice/common";
import appConfigReducer from "@slices/configSlice/config";
import employeeHistorySlice from "@slices/employeeHistorySlice/employeeHistory";
import employeeReducer from "@slices/employeeSlice/employee";
import healthReducer from "@slices/healthSlice/health";
import metaReducer from "@slices/metaSlice/meta";
import parCycleReducer from "@slices/parCycleSlice/parCycle";
import reminderReducer from "@slices/reminderSlice/reminder";
import specialQuotaReducer from "@slices/specialQuotaSlice/specialQuota";
import teamReducer from "@slices/teamSlice/team";
import threeSixtyReviewReducer from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import userReducer from "@slices/userSlice/user";

import reportReducer from "./reportSlice/report";

enableMapSet();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    common: commonReducer,
    parCycle: parCycleReducer,
    employee: employeeReducer,
    appConfig: appConfigReducer,
    report: reportReducer,
    reminder: reminderReducer,
    meta: metaReducer,
    team: teamReducer,
    calendarSlice: calendarSlice,
    health: healthReducer,
    employeeHistorySlice: employeeHistorySlice,
    threeSixtyReview: threeSixtyReviewReducer,
    collection: collectionReducer,
    specialQuota: specialQuotaReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
