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
import { UnitType } from "@root/src/utils/utils";
import { EmployeeBasicInfo } from "@services/employee";
import { BusinessUnit, Company, SubTeam, Team, Unit } from "@services/organization";

import { getEntityTypeName } from "../utils";
import { useOrgMutation } from "./useOrgMutations";
import { SubTeamState, TeamState, UnitState } from "@root/src/slices/organizationSlice/organizationStructure";

interface UseOrgEntityActionsParams {
  data: Company | BusinessUnit | Team | SubTeam | Unit;
  onClose?: () => void;
}

export function useOrgEntityActions({ data, onClose }: UseOrgEntityActionsParams) {
  const {
    updateBusinessUnit,
    updateTeam,
    updateSubTeam,
    updateUnit,
    updateBusinessUnitTeam,
    updateTeamSubTeam,
    updateSubTeamUnit,
    deleteBusinessUnit,
    deleteBusinessUnitTeam,
    deleteTeamSubTeam,
    deleteSubTeamUnit,
    isLoading,
    isError,
    status,
    error,
  } = useOrgMutation();

  const entityTypeName = getEntityTypeName(data);

  const handleLeadSwap = async (selectedEmployee: EmployeeBasicInfo) => {
    const payload = { functionalLeadEmail: selectedEmployee.workEmail };

    switch (entityTypeName) {
      case UnitType.Team:
        await updateBusinessUnitTeam({ buId: (data as TeamState).businessUnitId, teamId: (data as TeamState).id, payload });
        break;
      case UnitType.SubTeam:
        await updateTeamSubTeam({ businessUnitTeamId: (data as SubTeamState).businessUnitTeamId, subTeamId: (data as SubTeamState).id, payload });
        break;
      case UnitType.Unit:
        await updateSubTeamUnit({ businessUnitTeamSubTeamId: (data as UnitState).businessUnitTeamSubTeamId, unitId: (data as UnitState).id, payload });
        break;
    }
  };

  const handleHeadSwap = async (selectedEmployee: EmployeeBasicInfo, _reason: string) => {
    const payload = { headEmail: selectedEmployee.workEmail };

    switch (entityTypeName) {
      case UnitType.BusinessUnit:
        await updateBusinessUnit({ buId: data.id, payload });
        break;
      case UnitType.Team:
        await updateTeam({ teamId: data.id, payload });
        break;
      case UnitType.SubTeam:
        await updateSubTeam({ subTeamId: data.id, payload });
        break;
      case UnitType.Unit:
        await updateUnit({ unitId: data.id, payload });
        break;
    }
  };

  const handleDeleteCurrent = async (_reason: string) => {
    try {
      switch (entityTypeName) {
        case UnitType.BusinessUnit:
          await deleteBusinessUnit({ buId: data.id }).unwrap();
          break;
        case UnitType.Team:
          await deleteBusinessUnitTeam({ buId: data.id, teamId: data.id }).unwrap();
          break;
        case UnitType.SubTeam:
          await deleteTeamSubTeam({ businessUnitTeamId: data.id, subTeamId: data.id }).unwrap();
          break;
        case UnitType.Unit:
          await deleteSubTeamUnit({ businessUnitTeamSubTeamId: data.id, unitId: data.id }).unwrap();
          break;
      }
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to delete entity", err);
    }
  };

  const handleRenameCurrent = async (entityName: string) => {
    const payload = { name: entityName };

    console.log("Payload : ", payload);
    console.log("data : ", data);

    switch (entityTypeName) {
      case UnitType.BusinessUnit:
        await updateBusinessUnit({ buId: data.id, payload });
        break;
      case UnitType.Team:
        await updateTeam({ teamId: data.id, payload });
        break;
      case UnitType.SubTeam:
        await updateSubTeam({ subTeamId: data.id, payload });
        break;
      case UnitType.Unit:
        await updateUnit({ unitId: data.id, payload });
        break;
    }
  };

  return {
    entityTypeName,
    handleLeadSwap,
    handleHeadSwap,
    handleDeleteCurrent,
    handleRenameCurrent,
    isLoading,
    isError,
    status,
    error,
  };
}
