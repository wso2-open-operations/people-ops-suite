// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import { AppConfig } from "@config/config.ts";

import { RootState } from "../slices/store.ts";
import { baseQueryWithRetry } from "./BaseQuery.ts";

export interface Head {
  name: string;
  email: string;
  title: string;
  avatar?: string;
}

export interface FunctionalLead {
  name: string;
  email: string;
  title: string;
  avatar?: string;
}

export interface Unit {
  id: string;
  mappingId: string;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
}

export interface SubTeam {
  id: string;
  mappingId: string;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
  units: Unit[];
}

export interface Team {
  id: string;
  mappingId: string;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
  subTeams: SubTeam[];
}

export interface BusinessUnit {
  id: string;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
  teams: Team[];
}

export type OrgStructure = Company | BusinessUnit | Team | SubTeam | Unit;

export interface Company {
  id: string;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
  businessUnits: BusinessUnit[];
}

export interface PayloadType {
  name: string;
  headEmail: string;
  functionalLeadEmail: string;
}

interface OrgNodeLinkInfo {
  id: string;
  functionalLeadEmail: string;
}
export interface OrgNodePayload {
  name: string;
  headEmail: string;
  orgNodeLinkInfo?: OrgNodeLinkInfo;
}

export const organizationApi = createApi({
  reducerPath: "organizationApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
  endpoints: (builder) => ({
    getOrgStructure: builder.query<Company, void>({
      query: () => AppConfig.serviceUrls.organization,
      transformResponse: (response: Company) => {
        const companyHeadTitle = `${response.name} Head`;
        const companyLeadTitle = `${response.name} Lead`;
        if (response.head) response.head.title = companyHeadTitle;
        if (response.functionalLead) response.functionalLead.title = companyLeadTitle;

        response.businessUnits.forEach((bu) => {
          const buHeadTitle = `${bu.name} Head`;
          const buLeadTitle = `${bu.name} Lead`;
          if (bu.head) bu.head.title = buHeadTitle;
          if (bu.functionalLead) bu.functionalLead.title = buLeadTitle;

          bu.teams.forEach((team) => {
            const teamHeadTitle = `${bu.name} ${team.name} Head`;
            const teamLeadTitle = `${bu.name} ${team.name} Lead`;
            if (team.head) team.head.title = teamHeadTitle;
            if (team.functionalLead) team.functionalLead.title = teamLeadTitle;

            team.subTeams.forEach((subTeam) => {
              const subTeamHeadTitle = `${teamHeadTitle} ${subTeam.name} Head`;
              const subTeamLeadTitle = `${teamLeadTitle} ${subTeam.name} Lead`;
              if (subTeam.head) subTeam.head.title = subTeamHeadTitle;
              if (subTeam.functionalLead) subTeam.functionalLead.title = subTeamLeadTitle;

              subTeam.units.forEach((unit) => {
                const unitHeadTitle = `${subTeamHeadTitle} ${unit.name} Head`;
                const unitLeadTitle = `${subTeamLeadTitle} ${unit.name} Lead`;
                if (unit.head) unit.head.title = unitHeadTitle;
                if (unit.functionalLead) unit.functionalLead.title = unitLeadTitle;
              });
            });
          });
        });
        return response;
      },
      providesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addBusinessUnits: builder.mutation<void, OrgNodePayload>({
      queryFn: async (payload, { getState }, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-units`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addTeam: builder.mutation<void, { buId: string; payload: OrgNodePayload }>({
      queryFn: async ({ payload }, { getState }, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/teams`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addSubTeam: builder.mutation<void, { teamId: string; payload: OrgNodePayload }>({
      queryFn: async ({ payload }, { getState }, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-teams`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addUnit: builder.mutation<void, { subTeamId: string; payload: OrgNodePayload }>({
      queryFn: async ({ payload }, { getState }, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/units`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateBusinessUnit: builder.mutation<void, { id: string; payload: Partial<PayloadType> }>({
      queryFn: async ({ id, payload }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${id}`,
          method: "PATCH",
          body: {
            ...payload,
            updatedBy: userEmail,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateTeam: builder.mutation<void, { id: string; payload: Partial<PayloadType> }>({
      queryFn: async ({ id, payload }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${id}`,
          method: "PATCH",
          body: {
            ...payload,
            updatedBy: userEmail,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateSubTeam: builder.mutation<void, { id: string; payload: Partial<PayloadType> }>({
      queryFn: async ({ id, payload }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${id}`,
          method: "PATCH",
          body: {
            ...payload,
            updatedBy: userEmail,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateUnit: builder.mutation<void, { id: string; payload: Partial<PayloadType> }>({
      queryFn: async ({ id, payload }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/unit/${id}`,
          method: "PATCH",
          body: {
            ...payload,
            updatedBy: userEmail,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateBusinessUnitTeam: builder.mutation<
      void,
      { buId: string; teamId: string; payload: Partial<PayloadType> }
    >({
      queryFn: async ({ buId, teamId, payload }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}/team/${teamId}`,
          method: "PATCH",
          body: {
            ...payload,
            updatedBy: userEmail,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateTeamSubTeam: builder.mutation<
      void,
      { teamId: string; subTeamId: string; payload: Partial<PayloadType> }
    >({
      queryFn: async ({ teamId, subTeamId, payload }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${teamId}/sub-team/${subTeamId}`,
          method: "PATCH",
          body: {
            ...payload,
            updatedBy: userEmail,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateSubTeamUnit: builder.mutation<
      void,
      { subTeamId: string; unitId: string; payload: Partial<PayloadType> }
    >({
      queryFn: async ({ subTeamId, unitId, payload }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${subTeamId}/unit/${unitId}`,
          method: "PATCH",
          body: {
            ...payload,
            updatedBy: userEmail,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteBusinessUnit: builder.mutation<void, { id: string }>({
      queryFn: async ({ id }, { getState }, _extraoptions, baseQuery) => {
        const state = getState() as RootState;
        const userEmail = state.user.userInfo?.workEmail;

        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${id}`,
          method: "DELETE",
        });

        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteBusinessUnitTeam: builder.mutation<void, { buId: string; teamId: string }>({
      queryFn: async ({ buId, teamId }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}/team/${teamId}`,
          method: "DELETE",
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteTeamSubTeam: builder.mutation<void, { teamId: string; subTeamId: string }>({
      queryFn: async ({ teamId, subTeamId }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${teamId}/sub-team/${subTeamId}`,
          method: "DELETE",
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteSubTeamUnit: builder.mutation<void, { subTeamId: string; unitId: string }>({
      queryFn: async ({ subTeamId, unitId }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${subTeamId}/unit/${unitId}`,
          method: "DELETE",
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),
  }),
});

export const {
  useGetOrgStructureQuery,
  useAddBusinessUnitsMutation,
  useAddTeamMutation,
  useAddSubTeamMutation,
  useAddUnitMutation,
  useUpdateBusinessUnitMutation,
  useUpdateTeamMutation,
  useUpdateSubTeamMutation,
  useUpdateUnitMutation,
  useUpdateBusinessUnitTeamMutation,
  useUpdateTeamSubTeamMutation,
  useUpdateSubTeamUnitMutation,
  useDeleteBusinessUnitMutation,
  useDeleteBusinessUnitTeamMutation,
  useDeleteTeamSubTeamMutation,
  useDeleteSubTeamUnitMutation,
} = organizationApi;
