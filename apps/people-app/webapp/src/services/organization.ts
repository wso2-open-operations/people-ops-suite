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
  id: number;
  businessUnitTeamSubTeamUnitId: number;
  businessUnitTeamSubTeamId: number;
  businessUnitTeamId: number;
  businessUnitId: number;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
}

export interface SubTeam {
  id: number;
  businessUnitTeamSubTeamId: number;
  businessUnitTeamId: number;
  businessUnitId: number;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
  units: Unit[];
}

export interface Team {
  id: number;
  businessUnitId: number;
  businessUnitTeamId: number;
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
  subTeams: SubTeam[];
}
export interface BusinessUnit {
  id: number;
  name: string;
  headCount: number;
  head?: Head;
  teams: Team[];
}

export interface Company {
  id: number;
  name: string;
  headCount: number;
  businessUnits: BusinessUnit[];
}

export type OrgStructure = Company | BusinessUnit | Team | SubTeam | Unit;

export interface PayloadType {
  name: string;
  headEmail: string;
  functionalLeadEmail: string;
}

export interface UpdateBusinessUnitPayload {
  name: string;
  headEmail: string;
  functionalLeadEmail: string;
}

export interface UpdateTeamPayload {
  name: string;
  headEmail: string;
  functionalLeadEmail: string;
}

export interface UpdateSubTeamPayload {
  name: string;
  headEmail: string;
  functionalLeadEmail: string;
}

export interface UpdateUnitPayload {
  name: string;
  headEmail: string;
  functionalLeadEmail: string;
}

export interface CreateBusinessUnitPayload {
  name: string;
  headEmail: string;
}

export interface CreateBusinessUnitTeamPayload {
  businessUnitId: number;
  teamId?: number;
  functionalLeadEmail: string;
}

export interface CreateTeamPayload {
  name: string;
  headEmail: string;
  businessUnit?: CreateBusinessUnitTeamPayload;
}

export interface CreateBusinessUnitTeamSubTeamPayload {
  businessUnitTeamId: number;
  subTeamId?: number;
  functionalLeadEmail: string;
}

export interface CreateSubTeamPayload {
  name: string;
  headEmail: string;
  businessUnitTeam?: CreateBusinessUnitTeamSubTeamPayload;
}

export interface CreateBusinessUnitTeamSubTeamUnitPayload {
  businessUnitTeamSubTeamId: number;
  unitId?: number;
  functionalLeadEmail: string;
}

export interface CreateUnitPayload {
  name: string;
  headEmail: string;
  businessUnitTeamSubTeamUnit?: CreateBusinessUnitTeamSubTeamUnitPayload;
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

export interface OrgNodeMappingPayload {
  parentId: string;
  childId: string;
  functionalLeadEmail: string;
}

export const organizationApi = createApi({
  reducerPath: "organizationApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
  endpoints: (builder) => ({
    getOrgStructure: builder.query<Company, void>({
      query: () => AppConfig.serviceUrls.organization,
      transformResponse: (response: Company) => {
        response.businessUnits.forEach((bu) => {
          const buHeadTitle = `${bu.name} Head`;
          if (bu.head) bu.head.title = buHeadTitle;

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

    addBusinessUnits: builder.mutation<void, CreateBusinessUnitPayload>({
      queryFn: async (payload, _api, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-units`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addTeams: builder.mutation<void, { buId: string; payload: CreateTeamPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/teams`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addSubTeams: builder.mutation<void, { teamId: string; payload: CreateSubTeamPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-teams`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addUnits: builder.mutation<void, { subTeamId: string; payload: CreateUnitPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/units`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addBusinessUnitTeam: builder.mutation<void, { payload: CreateBusinessUnitTeamPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/team`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addTeamSubTeam: builder.mutation<void, { payload: CreateBusinessUnitTeamSubTeamPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/sub-team`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    addSubTeamUnit: builder.mutation<void, { payload: CreateBusinessUnitTeamSubTeamUnitPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/unit`,
          method: "POST",
          body: payload,
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateBusinessUnit: builder.mutation<
      void,
      { buId: number; payload: Partial<UpdateBusinessUnitPayload> }
    >({
      queryFn: async ({ buId, payload }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateTeam: builder.mutation<void, { teamId: number; payload: Partial<UpdateTeamPayload> }>({
      queryFn: async ({ teamId, payload }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${teamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateSubTeam: builder.mutation<
      void,
      { subTeamId: number; payload: Partial<UpdateSubTeamPayload> }
    >({
      queryFn: async ({ subTeamId, payload }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${subTeamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateUnit: builder.mutation<void, { unitId: number; payload: Partial<UpdateUnitPayload> }>({
      queryFn: async ({ unitId, payload }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/unit/${unitId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateBusinessUnitTeam: builder.mutation<
      void,
      {
        buId: number;
        teamId: number;
        payload: Pick<UpdateBusinessUnitPayload, "functionalLeadEmail">;
      }
    >({
      queryFn: async ({ buId, teamId, payload }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}/team/${teamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateTeamSubTeam: builder.mutation<
      void,
      {
        businessUnitTeamId: number;
        subTeamId: number;
        payload: Pick<UpdateTeamPayload, "functionalLeadEmail">;
      }
    >({
      queryFn: async (
        { businessUnitTeamId, subTeamId, payload },
        _api,
        _extraoptions,
        baseQuery,
      ) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${businessUnitTeamId}/sub-team/${subTeamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    updateSubTeamUnit: builder.mutation<
      void,
      {
        businessUnitTeamSubTeamId: number;
        unitId: number;
        payload: Pick<UpdateSubTeamPayload, "functionalLeadEmail">;
      }
    >({
      queryFn: async (
        { businessUnitTeamSubTeamId, unitId, payload },
        _api,
        _extraoptions,
        baseQuery,
      ) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${businessUnitTeamSubTeamId}/unit/${unitId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteBusinessUnit: builder.mutation<void, { buId: number }>({
      queryFn: async ({ buId }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}`,
          method: "DELETE",
        });

        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteBusinessUnitTeam: builder.mutation<void, { buId: number; teamId: number }>({
      queryFn: async ({ buId, teamId }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}/team/${teamId}`,
          method: "DELETE",
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteTeamSubTeam: builder.mutation<void, { businessUnitTeamId: number; subTeamId: number }>({
      queryFn: async ({ businessUnitTeamId, subTeamId }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${businessUnitTeamId}/sub-team/${subTeamId}`,
          method: "DELETE",
        });
        return data.error ? { error: data.error } : { data: undefined };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
    }),

    deleteSubTeamUnit: builder.mutation<
      void,
      { businessUnitTeamSubTeamId: number; unitId: number }
    >({
      queryFn: async ({ businessUnitTeamSubTeamId, unitId }, _api, _extraoptions, baseQuery) => {
        const data = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${businessUnitTeamSubTeamId}/unit/${unitId}`,
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
  useAddTeamsMutation,
  useAddSubTeamsMutation,
  useAddUnitsMutation,
  useAddBusinessUnitTeamMutation,
  useAddTeamSubTeamMutation,
  useAddSubTeamUnitMutation,
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
