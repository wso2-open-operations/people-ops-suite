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

import { AppConfig } from "@config/config";

import { enqueueSnackbarMessage } from "../slices/commonSlice/common";
import { baseQueryWithRetry } from "./BaseQuery";

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
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
}

export interface SubTeam {
  id: number;
  businessUnitTeamSubTeamId: number;
  businessUnitTeamId: number;
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

export interface RenameBusinessUnitPayload {
  name: string;
  businessUnitId: string;
}

export interface RenameTeamPayload {
  name: string;
  teamId: string;
}

export interface RenameSubTeamPayload {
  name: string;
  subTeamId: string;
}

export interface RenameUnitPayload {
  name: string;
  unitId: string;
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
  headEmail?: string;
}

export interface CreateBusinessUnitTeamPayload {
  businessUnitId: number;
  teamId?: number;
  functionalLeadEmail?: string;
}

export interface CreateTeamPayload {
  name: string;
  headEmail?: string;
  businessUnit?: CreateBusinessUnitTeamPayload;
}

export interface CreateBusinessUnitTeamSubTeamPayload {
  businessUnitTeamId: number;
  subTeamId?: number;
  functionalLeadEmail?: string;
}

export interface CreateSubTeamPayload {
  name: string;
  headEmail?: string;
  businessUnitTeam?: CreateBusinessUnitTeamSubTeamPayload;
}

export interface CreateBusinessUnitTeamSubTeamUnitPayload {
  businessUnitTeamSubTeamId: number;
  unitId?: number;
  functionalLeadEmail?: string;
}

export interface CreateUnitPayload {
  name: string;
  headEmail?: string;
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

export interface ApiMessageOnSuccess {
  message?: string;
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
            const teamHeadTitle = `${team.name}`;
            const teamLeadTitle = `${bu.name} Bu - ${team.name}`;
            if (team.head) team.head.title = teamHeadTitle;
            if (team.functionalLead) team.functionalLead.title = teamLeadTitle;

            team.subTeams.forEach((subTeam) => {
              const subTeamHeadTitle = `${subTeam.name}`;
              const subTeamLeadTitle = `${teamLeadTitle} - ${subTeam.name} Sub Team`;
              if (subTeam.head) subTeam.head.title = subTeamHeadTitle;
              if (subTeam.functionalLead) subTeam.functionalLead.title = subTeamLeadTitle;

              subTeam.units.forEach((unit) => {
                const unitHeadTitle = `${unit.name}`;
                const unitLeadTitle = `${subTeamLeadTitle} - ${unit.name} Unit`;
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

    addBusinessUnits: builder.mutation<ApiMessageOnSuccess, CreateBusinessUnitPayload>({
      queryFn: async (payload, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-units`,
          method: "POST",
          body: payload,
        });

        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_payload, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully added business unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message ||
            `An error occurred while adding business unit ${_payload.name}`;
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    addTeams: builder.mutation<ApiMessageOnSuccess, { payload: CreateTeamPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/teams`,
          method: "POST",
          body: payload,
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted({ payload }, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? `Successfully added team ${payload.name}`,
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || `An error occurred while adding team ${payload.name}`;
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    addSubTeams: builder.mutation<ApiMessageOnSuccess, { payload: CreateSubTeamPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-teams`,
          method: "POST",
          body: payload,
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted({ payload }, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? `Successfully added sub team ${payload.name}`,
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || `An error occurred while adding sub team ${payload.name}`;
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    addUnits: builder.mutation<ApiMessageOnSuccess, { payload: CreateUnitPayload }>({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/units`,
          method: "POST",
          body: payload,
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted({ payload }, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? `Successfully added unit ${payload.name}`,
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || `An error occurred while adding unit ${payload.name}`;
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    addBusinessUnitTeam: builder.mutation<
      ApiMessageOnSuccess,
      { payload: CreateBusinessUnitTeamPayload }
    >({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/team`,
          method: "POST",
          body: payload,
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully linked team to business unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while linking team to business unit";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    addTeamSubTeam: builder.mutation<
      ApiMessageOnSuccess,
      { payload: CreateBusinessUnitTeamSubTeamPayload }
    >({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/sub-team`,
          method: "POST",
          body: payload,
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully linked sub team to team",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while linking sub team to team";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    addSubTeamUnit: builder.mutation<
      ApiMessageOnSuccess,
      { payload: CreateBusinessUnitTeamSubTeamUnitPayload }
    >({
      queryFn: async ({ payload }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/unit`,
          method: "POST",
          body: payload,
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully linked unit to sub team",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while linking unit to sub team";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    renameBusinessUnit: builder.mutation<
      ApiMessageOnSuccess,
      { buId: number; payload: Partial<RenameBusinessUnitPayload> }
    >({
      queryFn: async ({ buId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}/rename`,
          method: "POST",
          body: {
            name: payload.name,
            businessUnitId: buId,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully renamed business unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while renaming business unit";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    renameTeam: builder.mutation<
      ApiMessageOnSuccess,
      { teamId: number; payload: Partial<RenameTeamPayload> }
    >({
      queryFn: async ({ teamId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${teamId}/rename`,
          method: "POST",
          body: {
            name: payload.name,
            teamId,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully renamed team",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while renaming team";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    renameSubTeam: builder.mutation<
      ApiMessageOnSuccess,
      { subTeamId: number; payload: Partial<RenameSubTeamPayload> }
    >({
      queryFn: async ({ subTeamId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${subTeamId}/rename`,
          method: "POST",
          body: {
            name: payload.name,
            subTeamId,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully renamed sub team",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while renaming sub team";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    renameUnit: builder.mutation<
      ApiMessageOnSuccess,
      { unitId: number; payload: Partial<RenameUnitPayload> }
    >({
      queryFn: async ({ unitId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/unit/${unitId}/rename`,
          method: "POST",
          body: {
            name: payload.name,
            unitId,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully renamed unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while renaming unit";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    updateBusinessUnit: builder.mutation<
      ApiMessageOnSuccess,
      { buId: number; payload: Partial<UpdateBusinessUnitPayload> }
    >({
      queryFn: async ({ buId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully updated business unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while updating business unit";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    updateTeam: builder.mutation<
      ApiMessageOnSuccess,
      { teamId: number; payload: Partial<UpdateTeamPayload> }
    >({
      queryFn: async ({ teamId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${teamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully updated team",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while updating team";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    updateSubTeam: builder.mutation<
      ApiMessageOnSuccess,
      { subTeamId: number; payload: Partial<UpdateSubTeamPayload> }
    >({
      queryFn: async ({ subTeamId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${subTeamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully updated sub team",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while updating sub team";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    updateUnit: builder.mutation<
      ApiMessageOnSuccess,
      { unitId: number; payload: Partial<UpdateUnitPayload> }
    >({
      queryFn: async ({ unitId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/unit/${unitId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully updated unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while updating unit";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    updateBusinessUnitTeam: builder.mutation<
      ApiMessageOnSuccess,
      {
        buId: number;
        teamId: number;
        payload: Pick<UpdateBusinessUnitPayload, "functionalLeadEmail">;
      }
    >({
      queryFn: async ({ buId, teamId, payload }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}/team/${teamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully updated functional lead",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while updating functional lead";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    updateTeamSubTeam: builder.mutation<
      ApiMessageOnSuccess,
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
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${businessUnitTeamId}/sub-team/${subTeamId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully updated functional lead",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while updating functional lead";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    updateSubTeamUnit: builder.mutation<
      ApiMessageOnSuccess,
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
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${businessUnitTeamSubTeamId}/unit/${unitId}`,
          method: "PATCH",
          body: {
            ...payload,
          },
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully updated functional lead",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while updating functional lead";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    deleteBusinessUnit: builder.mutation<ApiMessageOnSuccess, { buId: number }>({
      queryFn: async ({ buId }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}`,
          method: "DELETE",
        });

        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully deleted business unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while deleting business unit";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    deleteBusinessUnitTeam: builder.mutation<ApiMessageOnSuccess, { buId: number; teamId: number }>(
      {
        queryFn: async ({ buId, teamId }, _api, _extraoptions, baseQuery) => {
          const result = await baseQuery({
            url: `${AppConfig.serviceUrls.organization}/business-unit/${buId}/team/${teamId}`,
            method: "DELETE",
          });
          if (result.error) return { error: result.error };

          return { data: (result.data as ApiMessageOnSuccess) ?? {} };
        },
        invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const response = await queryFulfilled;
            dispatch(
              enqueueSnackbarMessage({
                message: response.data.message ?? "Successfully deleted team",
                type: "success",
              }),
            );
          } catch (error: any) {
            const errorMessage =
              error.error?.data?.message || "An error occurred while deleting team";
            dispatch(
              enqueueSnackbarMessage({
                message: errorMessage,
                type: "error",
              }),
            );
          }
        },
      },
    ),

    deleteTeamSubTeam: builder.mutation<
      ApiMessageOnSuccess,
      { businessUnitTeamId: number; subTeamId: number }
    >({
      queryFn: async ({ businessUnitTeamId, subTeamId }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/team/${businessUnitTeamId}/sub-team/${subTeamId}`,
          method: "DELETE",
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully deleted sub team",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while deleting sub team";
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            }),
          );
        }
      },
    }),

    deleteSubTeamUnit: builder.mutation<
      ApiMessageOnSuccess,
      { businessUnitTeamSubTeamId: number; unitId: number }
    >({
      queryFn: async ({ businessUnitTeamSubTeamId, unitId }, _api, _extraoptions, baseQuery) => {
        const result = await baseQuery({
          url: `${AppConfig.serviceUrls.organization}/sub-team/${businessUnitTeamSubTeamId}/unit/${unitId}`,
          method: "DELETE",
        });
        if (result.error) return { error: result.error };

        return { data: (result.data as ApiMessageOnSuccess) ?? {} };
      },
      invalidatesTags: ["BU", "TEAM", "SUB_TEAM", "UNIT"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(
            enqueueSnackbarMessage({
              message: response.data.message ?? "Successfully deleted unit",
              type: "success",
            }),
          );
        } catch (error: any) {
          const errorMessage =
            error.error?.data?.message || "An error occurred while deleting unit";
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
  useGetOrgStructureQuery,
  useAddBusinessUnitsMutation,
  useAddTeamsMutation,
  useAddSubTeamsMutation,
  useAddUnitsMutation,
  useAddBusinessUnitTeamMutation,
  useAddTeamSubTeamMutation,
  useAddSubTeamUnitMutation,
  useRenameBusinessUnitMutation,
  useRenameTeamMutation,
  useRenameSubTeamMutation,
  useRenameUnitMutation,
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
