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
import commonReducer from "@slices/commonSlice/common";
import contactReducer from "@slices/contactSlice/contact";
import customerReducer from "@slices/customerSlice/customer";
import employeeReducer from "@slices/employeeSlice/employee";
import userReducer from "@slices/userSlice/user";

import { apiSlice } from "./api/apiSlice";

enableMapSet();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    common: commonReducer,
    contact: contactReducer,
    employee: employeeReducer,
    customer: customerReducer,
    // appConfig: appConfigReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
