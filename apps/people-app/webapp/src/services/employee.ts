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
import { createApi } from "@reduxjs/toolkit/query/react";

import { EmergencyContact } from "@/types/types";
import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

import { baseQueryWithRetry } from "./BaseQuery";

// Types
export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  secondaryJobTitle: string;
  epf: string;
  employmentLocation: string;
  workLocation: string;
  workPhoneNumber: string | null;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails: string | null;
  employeeStatus: string;
  probationEndDate: string | null;
  agreementEndDate: string | null;
  employmentType: string;
  designation: string;
  office: string;
  businessUnit: string;
  team: string;
  subTeam: string;
  unit: string | null;
}

export interface EmployeeBasicInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail?: string;
  designation?: string;
}

export interface CreatePersonalInfoPayload {
  nicOrPassport: string;
  fullName: string;
  nameWithInitials?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  dob?: string;
  age?: number;
  personalEmail?: string;
  personalPhone?: string;
  residentNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  nationality?: string;
  emergencyContacts?: EmergencyContact[];
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  epf?: string;
  secondaryJobTitle: string;
  employmentLocation: string;
  workLocation: string;
  workEmail: string;
  workPhoneNumber?: string;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails?: string[];
  employeeStatus: string;
  employeeThumbnail?: string;
  subordinateCount?: number;
  probationEndDate?: string;
  agreementEndDate?: string;
  employmentTypeId?: number;
  designationId: number;
  officeId: number;
  teamId: number;
  subTeamId?: number;
  businessUnitId: number;
  unitId?: number;
  continuousServiceRecord?: string | null;
  personalInfo: CreatePersonalInfoPayload;
}

export interface ContinuousServiceRecordInfo {
  id: number;
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  employmentLocation: string;
  workLocation: string;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails?: string | null;
  designation: string;
  secondaryJobTitle?: string;
  office: string;
  businessUnit: string;
  team: string;
  subTeam: string;
  unit?: string | null;
}

export interface EmployeePersonalInfo {
  id: number | null;
  nicOrPassport: string | null;
  fullName: string;
  nameWithInitials: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  dob: string | null;
  personalEmail: string | null;
  personalPhone: string | null;
  residentNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  country: string | null;
  nationality: string | null;
  emergencyContacts: EmergencyContact[] | null;
}

export interface EmployeePersonalInfoUpdate {
  personalEmail: string | null;
  personalPhone: string | null;
  residentNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContacts: EmergencyContact[] | null;
}

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    "Employee",
    "EmployeePersonalInfo",
    "EmployeesBasicInfo",
    "ContinuousServiceRecord",
    "Employees",
  ],
  endpoints: (builder) => ({
    // Get single employee
    getEmployee: builder.query<Employee, string>({
      query: (employeeId) => AppConfig.serviceUrls.employee(employeeId),
      providesTags: (_result, _error, employeeId) => [{ type: "Employee", id: employeeId }],
      async onQueryStarted(_employeeId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error: any) {
          const errorMessage =
            error.error?.status === 500
              ? SnackMessage.error.fetchEmployee
              : error.error?.data?.message ||
                "An unknown error occurred while fetching employee information.";

          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    getAllEmployees: builder.query<EmployeeBasicInfo[], void>({
      query: () => AppConfig.serviceUrls.employees,
      providesTags: ["Employees"],
    }),

    // Get employees basic info
    getEmployeesBasicInfo: builder.query<EmployeeBasicInfo[], void>({
      query: () => AppConfig.serviceUrls.employeesBasicInfo,
      providesTags: ["EmployeesBasicInfo"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error: any) {
          const errorMessage =
            error.error?.status === 500
              ? "Error fetching employees' basic information"
              : error.error?.data?.message ||
                "An unknown error occurred while fetching employees' basic information.";

          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    // Create employee
    createEmployee: builder.mutation<number, CreateEmployeePayload>({
      query: (payload) => ({
        url: AppConfig.serviceUrls.employees,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["EmployeesBasicInfo"],
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: "Employee created successfully!",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.status === 500
              ? SnackMessage.error.addEmployee
              : error.error?.data?.message || "Failed to create employee. Please try again.";

          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    // Get continuous service record
    getContinuousServiceRecord: builder.query<ContinuousServiceRecordInfo[], string>({
      query: (workEmail) =>
        `${AppConfig.serviceUrls.continuousServiceRecord}?workEmail=${encodeURIComponent(workEmail)}`,
      providesTags: (_result, _error, workEmail) => [
        { type: "ContinuousServiceRecord", id: workEmail },
      ],
      async onQueryStarted(_workEmail, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error: any) {
          const errorMessage =
            error.error?.status === 500
              ? "Error fetching continuous service record"
              : error.error?.data?.message ||
                "An unknown error occurred while fetching continuous service record";

          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    // Get employee personal info
    getEmployeePersonalInfo: builder.query<EmployeePersonalInfo, string>({
      query: (employeeId) => AppConfig.serviceUrls.employeePersonalInfo(employeeId),
      providesTags: (_result, _error, employeeId) => [
        { type: "EmployeePersonalInfo", id: employeeId },
      ],
      async onQueryStarted(_employeeId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error: any) {
          const errorMessage =
            error.error?.status === 500
              ? SnackMessage.error.fetchEmployee
              : error.error?.data?.message ||
                "An unknown error occurred while fetching employee personal information.";

          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    // Update employee personal info
    updateEmployeePersonalInfo: builder.mutation<
      EmployeePersonalInfo,
      { employeeId: string; data: Partial<EmployeePersonalInfoUpdate> }
    >({
      query: ({ employeeId, data }) => ({
        url: AppConfig.serviceUrls.employeePersonalInfo(employeeId),
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        { type: "EmployeePersonalInfo", id: employeeId },
        { type: "Employee", id: employeeId },
      ],
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully updated!",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.status === 500
              ? SnackMessage.error.updateEmployeePersonalInfo
              : error.error?.data?.message ||
                "An unknown error occurred while updating employee personal information.";

          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),
  }),
});

export const {
  useGetEmployeeQuery,
  useGetAllEmployeesQuery,
  useGetEmployeesBasicInfoQuery,
  useCreateEmployeeMutation,
  useGetContinuousServiceRecordQuery,
  useGetEmployeePersonalInfoQuery,
  useUpdateEmployeePersonalInfoMutation,
  useLazyGetEmployeeQuery,
  useLazyGetEmployeesBasicInfoQuery,
  useLazyGetContinuousServiceRecordQuery,
  useLazyGetEmployeePersonalInfoQuery,
} = employeeApi;
