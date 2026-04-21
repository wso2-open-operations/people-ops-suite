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
import {
  BusinessUnitState,
  CompanyState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@root/src/slices/organizationSlice/organizationStructure";
import { NodeType } from "@root/src/utils/types";
import { EmployeeBasicInfo } from "@services/employee";

import { useOrgUpdateMutations } from "./useOrgUpdateMutations";

interface UseOrgEntityActionsParams {
  data: CompanyState | BusinessUnitState | TeamState | SubTeamState | UnitState | null;
}

export function useOrgUpdateActions({ data }: UseOrgEntityActionsParams) {
  const {
    renameBusinessUnit,
    renameTeam,
    renameSubTeam,
    renameUnit,
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
  } = useOrgUpdateMutations();

  const isRenaming = (() => {
    if (!data) return false;

    switch (data.type) {
      case NodeType.BusinessUnit:
        return status.isRenamingBusinessUnit;
      case NodeType.Team:
        return status.isRenamingTeam;
      case NodeType.SubTeam:
        return status.isRenamingSubTeam;
      case NodeType.Unit:
        return status.isRenamingUnit;
      default:
        return false;
    }
  })();

  const isUpdating = (() => {
    if (!data) return false;

    switch (data.type) {
      case NodeType.BusinessUnit:
        return status.isUpdatingBU || status.isRenamingBusinessUnit;
      case NodeType.Team:
        return status.isUpdatingTeam || status.isUpdatingBUTeam || status.isRenamingTeam;
      case NodeType.SubTeam:
        return status.isUpdatingSubTeam || status.isUpdatingTeamSubTeam || status.isRenamingSubTeam;
      case NodeType.Unit:
        return status.isUpdatingUnit || status.isUpdatingSubTeamUnit || status.isRenamingUnit;
      default:
        return false;
    }
  })();

  const isDeleting = (() => {
    if (!data) return false;

    switch (data.type) {
      case NodeType.BusinessUnit:
        return status.isDeletingBU;
      case NodeType.Team:
        return status.isDeletingBUTeam;
      case NodeType.SubTeam:
        return status.isDeletingTeamSubTeam;
      case NodeType.Unit:
        return status.isDeletingSubTeamUnit;
      default:
        return false;
    }
  })();

  const handleLeadSwap = async (selectedEmployee: EmployeeBasicInfo, _reason?: string) => {
    if (!data) return;

    const payload = { functionalLeadEmail: selectedEmployee.workEmail };

    switch (data.type) {
      case NodeType.Team:
        await updateBusinessUnitTeam({
          buId: (data as TeamState).businessUnitId,
          teamId: (data as TeamState).id,
          payload,
        }).unwrap();
        break;
      case NodeType.SubTeam:
        await updateTeamSubTeam({
          businessUnitTeamId: (data as SubTeamState).businessUnitTeamId,
          subTeamId: (data as SubTeamState).id,
          payload,
        }).unwrap();
        break;
      case NodeType.Unit:
        await updateSubTeamUnit({
          businessUnitTeamSubTeamId: (data as UnitState).businessUnitTeamSubTeamId,
          unitId: (data as UnitState).id,
          payload,
        }).unwrap();
        break;
    }
  };

  const handleHeadSwap = async (selectedEmployee: EmployeeBasicInfo, _reason: string) => {
    if (!data) return;

    const payload = { headEmail: selectedEmployee.workEmail };

    switch (data.type) {
      case NodeType.BusinessUnit:
        await updateBusinessUnit({ buId: data.id, payload }).unwrap();
        break;
      case NodeType.Team:
        await updateTeam({ teamId: data.id, payload }).unwrap();
        break;
      case NodeType.SubTeam:
        await updateSubTeam({ subTeamId: data.id, payload }).unwrap();
        break;
      case NodeType.Unit:
        await updateUnit({ unitId: data.id, payload }).unwrap();
        break;
    }
  };

  const handleDeleteCurrent = async (_reason: string) => {
    if (!data) return;

    switch (data.type) {
      case NodeType.BusinessUnit:
        await deleteBusinessUnit({ buId: data.id }).unwrap();
        break;
      case NodeType.Team:
        await deleteBusinessUnitTeam({
          buId: (data as TeamState).businessUnitId,
          teamId: data.id,
        }).unwrap();
        break;
      case NodeType.SubTeam:
        await deleteTeamSubTeam({
          businessUnitTeamId: (data as SubTeamState).businessUnitTeamId,
          subTeamId: data.id,
        }).unwrap();
        break;
      case NodeType.Unit:
        await deleteSubTeamUnit({
          businessUnitTeamSubTeamId: (data as UnitState).businessUnitTeamSubTeamId,
          unitId: data.id,
        }).unwrap();
        break;
    }
  };

  const handleRenameCurrent = async (entityName: string) => {
    if (!data) return;

    const payload = { name: entityName };

    switch (data.type) {
      case NodeType.BusinessUnit:
        await renameBusinessUnit({ buId: data.id, payload }).unwrap();
        break;
      case NodeType.Team:
        await renameTeam({ teamId: data.id, payload }).unwrap();
        break;
      case NodeType.SubTeam:
        await renameSubTeam({ subTeamId: data.id, payload }).unwrap();
        break;
      case NodeType.Unit:
        await renameUnit({ unitId: data.id, payload }).unwrap();
        break;
    }
  };

  return {
    handleLeadSwap,
    handleHeadSwap,
    handleDeleteCurrent,
    handleRenameCurrent,
    isLoading,
    isRenaming,
    isUpdating,
    isDeleting,
    isError,
    status,
    error,
  };
}
