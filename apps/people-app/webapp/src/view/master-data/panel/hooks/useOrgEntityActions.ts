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

interface UseOrgEntityActionsParams {
  data: Company | BusinessUnit | Team | SubTeam | Unit;
  parentNode: Company | BusinessUnit | Team | SubTeam | null;
}

export function useOrgEntityActions({ data, parentNode }: UseOrgEntityActionsParams) {
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
    const entityId = data.id;
    const parentId = parentNode?.id ?? null;

    switch (entityTypeName) {
      case UnitType.Team:
        if (parentId) await updateBusinessUnitTeam({ buId: parentId, teamId: entityId, payload });
        break;
      case UnitType.SubTeam:
        if (parentId) {
          await updateTeamSubTeam({ teamId: parentId, subTeamId: entityId, payload });
        }
        break;
      case UnitType.Unit:
        if (parentId) {
          await updateSubTeamUnit({ subTeamId: parentId, unitId: entityId, payload });
        }
        break;
    }
  };

  const handleHeadSwap = async (selectedEmployee: EmployeeBasicInfo, _reason: string) => {
    const payload = { headEmail: selectedEmployee.workEmail };
    const entityId = data.id;

    switch (entityTypeName) {
      case UnitType.BusinessUnit:
        await updateBusinessUnit({ id: entityId, payload });
        break;
      case UnitType.Team:
        await updateTeam({ id: entityId, payload });
        break;
      case UnitType.SubTeam:
        await updateSubTeam({ id: entityId, payload });
        break;
      case UnitType.Unit:
        await updateUnit({ id: entityId, payload });
        break;
    }
  };

  const handleDeleteCurrent = async (_reason: string) => {
    switch (entityTypeName) {
      case UnitType.BusinessUnit:
        await deleteBusinessUnit({ id: data.id });
        break;
      case UnitType.Team:
        if (parentNode) await deleteBusinessUnitTeam({ buId: parentNode.id, teamId: data.id });
        break;
      case UnitType.SubTeam:
        if (parentNode) await deleteTeamSubTeam({ teamId: parentNode.id, subTeamId: data.id });
        break;
      case UnitType.Unit:
        if (parentNode) await deleteSubTeamUnit({ subTeamId: parentNode.id, unitId: data.id });
        break;
    }
  };

  const handleRenameCurrent = async (entityName: string) => {
    const payload = { name: entityName };

    switch (entityTypeName) {
      case UnitType.BusinessUnit:
        await updateBusinessUnit({ id: data.id, payload });
        break;
      case UnitType.Team:
        await updateTeam({ id: data.id, payload });
        break;
      case UnitType.SubTeam:
        await updateSubTeam({ id: data.id, payload });
        break;
      case UnitType.Unit:
        await updateUnit({ id: data.id, payload });
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
