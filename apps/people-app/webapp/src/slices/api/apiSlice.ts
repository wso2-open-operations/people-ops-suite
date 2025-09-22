import { createApi } from "@reduxjs/toolkit/query/react";
import { AppConfig } from "@root/src/config/config";

import { apiServiceBaseQuery } from "./apiBaseQuery";

export interface Unit {
  id: number;
  name: string;
  headEmail: string;
}

export interface SubTeam {
  id: number;
  name: string;
  headEmail: string;
  units?: Unit[];
}

export interface Team {
  id: number;
  name: string;
  headEmail: string;
  subTeams?: SubTeam[];
}

export interface BusinessUnit {
  id: number;
  name: string;
  headEmail: string;
  teams: Team[];
}

export interface Company {
  id: number;
  name: string;
  location: string;
}

export interface Office {
  id: number;
  office: string;
  location: string;
  companyId: number;
}

export interface Designation {
  id: number;
  name: string;
  jobBand: number;
  careerFunctionId: number;
}

export interface CareerFunction {
  id: number;
  name: string;
}

export interface EmploymentType {
  id: number;
  name: string;
}

export interface AppConfig {
  companies: Company[];
  offices: Office[];
  designations: Designation[];
  careerFunctions: CareerFunction[];
  employmentTypes: EmploymentType[];
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: apiServiceBaseQuery(),
  tagTypes: ["Org"] as const,
  endpoints: (builder) => ({
    getOrgData: builder.query<BusinessUnit[], void>({
      query: () => ({ url: AppConfig.serviceUrls.orgData }),
    }),

    getCompanyData: builder.query<AppConfig, void>({
      query: () => ({ url: AppConfig.serviceUrls.appConfig }),
    }),
  }),
});

export const { useGetOrgDataQuery, useGetCompanyDataQuery } = apiSlice;
