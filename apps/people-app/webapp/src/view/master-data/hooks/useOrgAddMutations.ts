// copyright (c) 2026 wso2 llc. (https://www.wso2.com).
//
// wso2 llc. licenses this file to you under the apache license,
// version 2.0 (the "license"); you may not use this file except
// in compliance with the license.
// you may obtain a copy of the license at
//
// http://www.apache.org/licenses/license-2.0
//
// unless required by applicable law or agreed to in writing,
// software distributed under the license is distributed on an
// "as is" basis, without warranties or conditions of any
// kind, either express or implied. see the license for the
// specific language governing permissions and limitations
// under the license.
import {
  useAddBusinessUnitTeamMutation,
  useAddBusinessUnitsMutation,
  useAddSubTeamUnitMutation,
  useAddSubTeamsMutation,
  useAddTeamSubTeamMutation,
  useAddTeamsMutation,
  useAddUnitsMutation,
} from "@services/organization";

export function useOrgAddMutations() {
  const [addBusinessUnits, { isLoading: isAddingBusinessUnit }] = useAddBusinessUnitsMutation();
  const [addBusinessUnitTeam, { isLoading: isAddingBusinessUnitTeam }] =
    useAddBusinessUnitTeamMutation();
  const [addTeams, { isLoading: isAddingTeam }] = useAddTeamsMutation();
  const [addSubTeams, { isLoading: isAddingSubTeam }] = useAddSubTeamsMutation();
  const [addTeamSubTeam, { isLoading: isAddingTeamSubTeam }] = useAddTeamSubTeamMutation();
  const [addUnits, { isLoading: isAddingUnit }] = useAddUnitsMutation();
  const [addSubTeamUnit, { isLoading: isAddingSubTeamUnit }] = useAddSubTeamUnitMutation();

  const isAdding = isAddingBusinessUnit || isAddingBusinessUnitTeam || isAddingTeam || isAddingSubTeam || isAddingTeamSubTeam ||
    isAddingUnit || isAddingSubTeamUnit


  return {
    isAdding,

    // mutation triggers
    addBusinessUnits,
    addBusinessUnitTeam,
    addTeams,
    addSubTeams,
    addUnits,
    addTeamSubTeam,
    addSubTeamUnit,

    // individual loading flags
    isLoading: {
      isAddingBusinessUnit,
      isAddingBusinessUnitTeam,
      isAddingTeam,
      isAddingSubTeam,
      isAddingTeamSubTeam,
      isAddingUnit,
      isAddingSubTeamUnit
    }
  }
}
