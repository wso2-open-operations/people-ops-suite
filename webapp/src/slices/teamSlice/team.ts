// // Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
// //
// // This software is the property of WSO2 LLC. and its suppliers, if any.
// // Dissemination of any information or reproduction of any material contained
// // herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// // You may not alter or remove any copyright or other notice from copies of this content.

// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import { RootState } from "@slices/store";
// import { AppConfig } from "../../config/config";
// import { RequestState } from "@utils/types";
// import { ApiService } from "@utils/apiService";
// import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
// import { sliceErrorMessages, SnackMessage } from "@config/constant";
// import { AxiosError, HttpStatusCode } from "axios";
// import { calculateAllTeamsSummary, getErrorMessage } from "@utils/utils";
// import { ParThreeSixtyReviewStatus } from "@slices/threeSixtyReviewSlice/threeSixtyReview";
// import { ParRating } from "@slices/employeeHistorySlice/employeeHistory";

// interface teamState {
//   teams: Team[];
//   allTeamsSummary: AllTeamsSummary;
//   selectedTeamReport: TeamReport | null;
//   status: RequestState;
//   reportStatus: RequestState;
// }

// interface GetTeamReportRequest {
//   parCycleId: number;
//   teamId: number;
// }

// interface GetTeamsRequest {
//   parCycleId: number;
//   email?: string;
//   signal: AbortSignal;
// }

// export interface AllTeamsSummary {
//   totalEmployees: number;
//   totalEmployeeParComplete: number;
//   totalLeadReviewComplete: number;
//   totalF2fComplete: number;
// }

// export interface Team {
//   parTeamId: number;
//   parLeadEmail: string;
//   parBusinessUnit: string;
//   parDepartment: string;
//   parTeam: string;
//   parSubTeam: string;
//   numberOfTeamMembers: number;
//   numberOf5pSlots: number;
//   numberOf20pSlots: number;
//   summary: TeamSummary;
// }

// export interface TeamSummary {
//   employeeParCompletedCount: number;
//   threeSixtyReviewCompletedCount: number;
//   leadsReviewCompletedCount: number;
//   f2fCompletedCount: number;
// }

// export interface TeamReport {
//   parCycleId: number;
//   parTeamId: number;
//   parBusinessUnit: string;
//   parDepartment: string;
//   parTeam: string;
//   parSubTeam: string;
//   parLeadEmail: string;
//   numberOfTeamMembers: number;
//   available5pSlots: number;
//   available20pSlots: number;
//   numberOf5pSlots: number;
//   numberOf20pSlots: number;
//   summary: TeamSummary;
//   details: ParRatingShort[];
// }
// export interface ParRatingShort extends Omit<ParRating, "parEmployeeComment"> {
//   par360ReviewStatus: ParThreeSixtyReviewStatus;
//   par360ReviewCounts?: {
//     requestedReviewCount: number;
//     sharedReviewCount: number;
//   };
// }

// const initialState: teamState = {
//   teams: [],
//   allTeamsSummary: {
//     totalEmployees: 0,
//     totalEmployeeParComplete: 0,
//     totalLeadReviewComplete: 0,
//     totalF2fComplete: 0,
//   },
//   selectedTeamReport: null,
//   status: RequestState.IDLE,
//   reportStatus: RequestState.IDLE,
// };

// export const fetchTeams = createAsyncThunk(
//   "team/fetchTeams",
//   async ({ parCycleId, email, signal }: GetTeamsRequest, { dispatch }) => {
//     try {
//       let url = `${AppConfig.serviceUrls.parCycles}/${parCycleId}/teams`;
//       if (email) {
//         url += `?leadEmail=${email}`;
//       }
//       const response = await APIService.getInstance().get(url, { signal });

//       if (response.status === HttpStatusCode.Ok) {
//         return response.data;
//       } else {
//         throw new Error(
//           response.data?.message || sliceErrorMessages.teamSlice.fetchTeams
//         );
//       }
//     } catch (error) {
//       if (error instanceof AxiosError && error.name === "CanceledError") {
//         throw error;
//       }
//       const errorMessage = getErrorMessage(
//         error,
//         SnackMessage.error.fetchTeamReport
//       );

//       dispatch(
//         enqueueSnackbarMessage({
//           message: errorMessage,
//           type: "error",
//         })
//       );
//       throw error;
//     }
//   }
// );

// export const fetchTeamReport = createAsyncThunk(
//   "team/fetchTeamReport",
//   async ({ parCycleId, teamId }: GetTeamReportRequest, { dispatch }) => {
//     try {
//       const response = await APIService.getInstance().get(
//         `${AppConfig.serviceUrls.parCycles}/${parCycleId}/teams/${teamId}`
//       );

//       if (response.status === HttpStatusCode.Ok) {
//         return response.data;
//       } else {
//         throw new Error(
//           response.data?.message || sliceErrorMessages.teamSlice.fetchTeamReport
//         );
//       }
//     } catch (error) {
//       const errorMessage = getErrorMessage(
//         error,
//         SnackMessage.error.fetchTeamReport
//       );

//       dispatch(
//         enqueueSnackbarMessage({
//           message: errorMessage,
//           type: "error",
//         })
//       );
//       throw error;
//     }
//   }
// );

// const teamSlice = createSlice({
//   name: "team",
//   initialState,
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchTeams.pending, (state) => {
//         state.status = RequestState.LOADING;
//       })
//       .addCase(fetchTeams.fulfilled, (state, action) => {
//         state.teams = action.payload.sort((a: Team, b: Team) => {
//           if (a.parBusinessUnit !== b.parBusinessUnit) {
//             return a.parBusinessUnit.localeCompare(b.parBusinessUnit);
//           } else if (a.parDepartment !== b.parDepartment) {
//             return a.parDepartment.localeCompare(b.parDepartment);
//           } else if (a.parTeam !== b.parTeam) {
//             return a.parTeam.localeCompare(b.parTeam);
//           } else {
//             return a.parSubTeam.localeCompare(b.parSubTeam);
//           }
//         });
//         if (state.teams.length !== 0) {
//           state.allTeamsSummary = calculateAllTeamsSummary(state.teams);
//         }
//         state.status = RequestState.SUCCEEDED;
//       })
//       .addCase(fetchTeams.rejected, (state) => {
//         state.status = RequestState.FAILED;
//       })
//       .addCase(fetchTeamReport.pending, (state) => {
//         state.reportStatus = RequestState.LOADING;
//       })
//       .addCase(fetchTeamReport.fulfilled, (state, action) => {
//         state.selectedTeamReport = action.payload as TeamReport;
//         state.reportStatus = RequestState.SUCCEEDED;
//       })
//       .addCase(fetchTeamReport.rejected, (state) => {
//         state.reportStatus = RequestState.FAILED;
//         state.selectedTeamReport = null;
//       });
//   },
// });

// export const selectAllTeams = (state: RootState) => state.team.teams;
// export const selectTeamStatus = (state: RootState) => state.team.status;
// export const selectTeamReportStatus = (state: RootState) =>
//   state.team.reportStatus;
// export const selectTeamReport = (state: RootState) =>
//   state.team.selectedTeamReport;
// export const selectAllTeamsSummary = (state: RootState) =>
//   state.team.allTeamsSummary;

// export default teamSlice.reducer;
