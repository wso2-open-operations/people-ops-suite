// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";

import auth from "./authSlice";
import common from "./commonSlice/common";
import parCycleReducer from "./parCycleSlice";
import metaReducer from "./metaSlice";
import teamReducer from "./teamSlice";
import reminderReducer from "./reminderSlice";
import employeeReducer from "./employeeSlice";
import threeSixtyReviewReducer from "./threeSixtyReviewSlice";
import reportReducer from "./reportSlice";
import healthReducer from "./healthSlice";
import specialQuotaReducer from "./specialQuotaSlice";
import employeeHistorySlice from "./employeeHistorySlice";
import calendarSlice from "./calendarSlice";
import userReducer from "./userSlice";

enableMapSet();

export const store = configureStore({
  reducer: {
    auth: auth,
    common: common,
    user: userReducer,
    parCycle: parCycleReducer,
    team: teamReducer,
    employee: employeeReducer,
    meta: metaReducer,
    reminder: reminderReducer,
    threeSixtyReview: threeSixtyReviewReducer,
    report: reportReducer,
    health: healthReducer,
    specialQuota: specialQuotaReducer,
    employeeHistorySlice: employeeHistorySlice,
    calendarSlice: calendarSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: undefined,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
