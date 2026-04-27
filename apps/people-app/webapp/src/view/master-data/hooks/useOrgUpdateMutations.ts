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
  useDeleteBusinessUnitMutation,
  useDeleteBusinessUnitTeamMutation,
  useDeleteSubTeamUnitMutation,
  useDeleteTeamSubTeamMutation,
  useRenameBusinessUnitMutation,
  useRenameSubTeamMutation,
  useRenameTeamMutation,
  useRenameUnitMutation,
  useUpdateBusinessUnitMutation,
  useUpdateBusinessUnitTeamMutation,
  useUpdateSubTeamMutation,
  useUpdateSubTeamUnitMutation,
  useUpdateTeamMutation,
  useUpdateTeamSubTeamMutation,
  useUpdateUnitMutation,
} from "@services/organization";

export function useOrgUpdateMutations() {
  const [updateBusinessUnit, { isLoading: isUpdatingBU, isError: isErrorUpdatingBU }] =
    useUpdateBusinessUnitMutation();
  const [updateTeam, { isLoading: isUpdatingTeam, isError: isErrorUpdatingTeam }] =
    useUpdateTeamMutation();
  const [updateSubTeam, { isLoading: isUpdatingSubTeam, isError: isErrorUpdatingSubTeam }] =
    useUpdateSubTeamMutation();
  const [updateUnit, { isLoading: isUpdatingUnit, isError: isErrorUpdatingUnit }] =
    useUpdateUnitMutation();

  const [updateBusinessUnitTeam, { isLoading: isUpdatingBUTeam, isError: isErrorUpdatingBUTeam }] =
    useUpdateBusinessUnitTeamMutation();
  const [
    updateTeamSubTeam,
    { isLoading: isUpdatingTeamSubTeam, isError: isErrorUpdatingTeamSubTeam },
  ] = useUpdateTeamSubTeamMutation();
  const [
    updateSubTeamUnit,
    { isLoading: isUpdatingSubTeamUnit, isError: isErrorUpdatingSubTeamUnit },
  ] = useUpdateSubTeamUnitMutation();

  const [deleteBusinessUnit, { isLoading: isDeletingBU, isError: isErrorDeletingBU }] =
    useDeleteBusinessUnitMutation();
  const [deleteBusinessUnitTeam, { isLoading: isDeletingBUTeam, isError: isErrorDeletingBUTeam }] =
    useDeleteBusinessUnitTeamMutation();
  const [
    deleteTeamSubTeam,
    { isLoading: isDeletingTeamSubTeam, isError: isErrorDeletingTeamSubTeam },
  ] = useDeleteTeamSubTeamMutation();
  const [
    deleteSubTeamUnit,
    { isLoading: isDeletingSubTeamUnit, isError: isErrorDeletingSubTeamUnit },
  ] = useDeleteSubTeamUnitMutation();
  const [
    renameBusinessUnit,
    { isLoading: isRenamingBusinessUnit, isError: isErrorRenamingBusinessUnit },
  ] = useRenameBusinessUnitMutation();
  const [renameTeam, { isLoading: isRenamingTeam, isError: isErrorRenamingTeam }] =
    useRenameTeamMutation();
  const [renameSubTeam, { isLoading: isRenamingSubTeam, isError: isErrorRenamingSubTeam }] =
    useRenameSubTeamMutation();
  const [renameUnit, { isLoading: isRenamingUnit, isError: isErrorRenamingUnit }] =
    useRenameUnitMutation();

  const isLoading =
    isUpdatingBU ||
    isUpdatingTeam ||
    isUpdatingSubTeam ||
    isUpdatingUnit ||
    isUpdatingBUTeam ||
    isUpdatingTeamSubTeam ||
    isUpdatingSubTeamUnit ||
    isDeletingBU ||
    isDeletingBUTeam ||
    isDeletingTeamSubTeam ||
    isDeletingSubTeamUnit ||
    isRenamingBusinessUnit ||
    isRenamingTeam ||
    isRenamingSubTeam ||
    isRenamingUnit;

  const isError =
    isErrorUpdatingBU ||
    isErrorUpdatingTeam ||
    isErrorUpdatingSubTeam ||
    isErrorUpdatingUnit ||
    isErrorUpdatingBUTeam ||
    isErrorUpdatingTeamSubTeam ||
    isErrorUpdatingSubTeamUnit ||
    isErrorDeletingBU ||
    isErrorDeletingBUTeam ||
    isErrorDeletingTeamSubTeam ||
    isErrorDeletingSubTeamUnit ||
    isErrorRenamingBusinessUnit ||
    isErrorRenamingTeam ||
    isErrorRenamingSubTeam ||
    isErrorRenamingUnit;

  return {
    // mutation triggers
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

    renameBusinessUnit,
    renameTeam,
    renameSubTeam,
    renameUnit,

    // aggregated status
    isLoading,
    isError,

    // individual loading flags
    status: {
      isUpdatingBU,
      isUpdatingTeam,
      isUpdatingSubTeam,
      isUpdatingUnit,
      isUpdatingBUTeam,
      isUpdatingTeamSubTeam,
      isUpdatingSubTeamUnit,
      isDeletingBU,
      isDeletingBUTeam,
      isDeletingTeamSubTeam,
      isDeletingSubTeamUnit,
      isRenamingBusinessUnit,
      isRenamingTeam,
      isRenamingSubTeam,
      isRenamingUnit,
    },

    // individual error flags
    error: {
      isErrorUpdatingBU,
      isErrorUpdatingTeam,
      isErrorUpdatingSubTeam,
      isErrorUpdatingUnit,
      isErrorUpdatingBUTeam,
      isErrorUpdatingTeamSubTeam,
      isErrorUpdatingSubTeamUnit,
      isErrorDeletingBU,
      isErrorDeletingBUTeam,
      isErrorDeletingTeamSubTeam,
      isErrorDeletingSubTeamUnit,
      isErrorRenamingBusinessUnit,
      isErrorRenamingTeam,
      isErrorRenamingSubTeam,
      isErrorRenamingUnit,
    },
  };
}
