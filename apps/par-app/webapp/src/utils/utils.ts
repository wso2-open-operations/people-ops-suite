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

import { AxiosError } from "axios";

import { ParSpecialRating } from "@slices/employeeHistorySlice/employeeHistory";
import { AllTeamsSummary, Team } from "@slices/teamSlice/team";

export const isIncludedRole = (a: string[], b: string[]): boolean => {
  return [...getCrossItems(a, b), ...getCrossItems(b, a)].length > 0;
};

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

function getCrossItems<Role>(a: Role[], b: Role[]): Role[] {
  return a.filter((element) => {
    return b.includes(element);
  });
}

export const getErrorMessage = (error: unknown, defaultErrorMessage: string) => {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.message || error.response?.data?.error_message || defaultErrorMessage
    );
  }

  if (error instanceof Error) {
    return error.message || defaultErrorMessage;
  }

  return defaultErrorMessage;
};

export const getSpecialRatingLabel = (rating: ParSpecialRating | undefined): string => {
  switch (rating) {
    case ParSpecialRating.TOP_FIVE_PERCENT:
      return "Top 5%";
    case ParSpecialRating.TOP_TWENTY_PERCENT:
      return "Top 20%";
    case ParSpecialRating.NONE:
      return "Not Assigned";
    default:
      return "";
  }
};

export const getSpecialRatingEnum = (label: string): ParSpecialRating | undefined => {
  switch (label) {
    case "Top 5%":
      return ParSpecialRating.TOP_FIVE_PERCENT;
    case "Top 20%":
      return ParSpecialRating.TOP_TWENTY_PERCENT;
    case "Not Assigned":
      return ParSpecialRating.NONE;
    default:
      return undefined;
  }
};

export const calculateAllTeamsSummary = (teams: Team[]): AllTeamsSummary => {
  const totalEmployees = teams.reduce((acc, team) => acc + team.numberOfTeamMembers, 0);
  const totalEmployeeParComplete = teams.reduce(
    (acc, team) => acc + team.summary.employeeParCompletedCount,
    0,
  );
  const totalLeadReviewComplete = teams.reduce(
    (acc, team) => acc + team.summary.leadsReviewCompletedCount,
    0,
  );
  const totalF2fComplete = teams.reduce((acc, team) => acc + team.summary.f2fCompletedCount, 0);

  return {
    totalEmployees,
    totalEmployeeParComplete,
    totalLeadReviewComplete,
    totalF2fComplete,
  };
};

export interface CombinedTeam {
  parTeamId: string;
  parBusinessUnit: string;
  parDepartment: string;
  parTeam: string;
  numberOfTeamMembers: number;
  summary: {
    employeeParCompletedCount: number;
    leadsReviewCompletedCount: number;
    f2fCompletedCount: number;
  };
}

export const getCombinedTeams = (teams: Team[]): CombinedTeam[] => {
  interface Accumulator {
    [key: string]: CombinedTeam;
  }
  // Reduce the array to a single object where each key is a combination of parBusinessUnit, parDepartment, and parTeam
  const groupedObjects = teams.reduce((acc: Accumulator, team) => {
    // Create a unique key for each combination of parBusinessUnit, parDepartment, and parTeam
    const key = `${team.parBusinessUnit}-${team.parDepartment}-${team.parTeam}`;

    // If the key does not exist in the accumulator, initialize it
    if (!acc[key]) {
      acc[key] = {
        parTeamId: key,
        parBusinessUnit: team.parBusinessUnit,
        parDepartment: team.parDepartment,
        parTeam: team.parTeam,
        numberOfTeamMembers: 0,
        summary: {
          employeeParCompletedCount: 0,
          leadsReviewCompletedCount: 0,
          f2fCompletedCount: 0,
        },
      };
    }

    // Aggregate the values
    acc[key].numberOfTeamMembers += team.numberOfTeamMembers;

    acc[key].summary.employeeParCompletedCount += team.summary.employeeParCompletedCount;
    acc[key].summary.leadsReviewCompletedCount += team.summary.leadsReviewCompletedCount;
    acc[key].summary.f2fCompletedCount += team.summary.f2fCompletedCount;

    return acc;
  }, {});

  // Convert the accumulated object back to an array of Teams
  return Object.values(groupedObjects);
};
