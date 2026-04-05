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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.
import { Box } from "@mui/material";

import { useEffect, useState } from "react";

import ErrorHandler from "@component/common/ErrorHandler.tsx";
import { SPLIT_VIEW_SKELETON_DELAY_MS } from "@root/src/config/constant.ts";
import { useMinimumLoadingVisibility } from "@root/src/hooks/useMinimumLoadingVisibility.ts";
import {
  fetchBusinessUnits,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
} from "@root/src/slices/organizationSlice/organization.ts";
import { buildAddModalOptions } from "@root/src/utils/utils.ts";
import { useGetOrgStructureQuery } from "@services/organization";
import { State } from "@slices/authSlice/auth.ts";
import {
  BusinessUnit as RawBusinessUnit,
  SubTeam as RawSubTeam,
  Team as RawTeam,
  Unit as RawUnit,
} from "@slices/organizationSlice/organization";
import {
  BusinessUnitState,
  CompanyState,
  OrgStructureState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { NodeType } from "@utils/types";
import { EditModal } from "@view/master-data/components/EditModal";

import AddModal from "../../components/AddModal.tsx";
import SplitViewColumn from "./components/SplitViewColumn.tsx.tsx";
import SplitViewSkeleton from "./components/SplitViewSkeleton.tsx";
import { MatchSearch } from "./utils/globalSearch.ts";

type OnEdit = {
  open: boolean;
  uniqueId: string | null;
  type: NodeType | null;
};

export type AddOption = (RawBusinessUnit | RawTeam | RawSubTeam | RawUnit) & {
  canAdd?: boolean;
};

type OnAdd = {
  open: boolean;
  data: AddOption[] | null;
  type: NodeType | null;
  selectedNode: CompanyState | BusinessUnitState | TeamState | SubTeamState | UnitState | null;
};

export default function SplitView() {
  useGetOrgStructureQuery();

  const orgItemState = useAppSelector((state: RootState) => state.organizationStructure);
  const orgItems = orgItemState.organizationInfo;

  const showOrgSkeleton = useMinimumLoadingVisibility(
    orgItemState.state === State.Loading && !orgItems,
    SPLIT_VIEW_SKELETON_DELAY_MS,
  );

  const [editModal, setEditModal] = useState<OnEdit>({
    open: false,
    uniqueId: null,
    type: null,
  });

  const [addModal, setAddModal] = useState<OnAdd>({
    open: false,
    data: null,
    type: null,
    selectedNode: null,
  });

  const [searchTerm, setSearchTerm] = useState<string | null>();
  const [teamSearchTerm, setTeamSearchTerm] = useState<string | null>();
  const [subTeamSearchTerm, setSubTeamSearchTerm] = useState<string | null>();
  const [unitSearchTerm, setUnitSearchTerm] = useState<string | null>();
  const [searchMatches, setSearchMatches] = useState<MatchSearch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1);

  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSubTeamId, setSelectedSubTeamId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const currentMatch = activeMatchIndex >= 0 ? searchMatches[activeMatchIndex] : null;

  const { businessUnits, teams, subTeams, units } = useAppSelector((state) => state.organization);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!open) return;

    dispatch(fetchBusinessUnits());
    dispatch(fetchTeams({}));
    dispatch(fetchSubTeams({}));
    dispatch(fetchUnits({}));
  }, [dispatch, open]);

  // Global search UI is temporarily disabled; keep this derived flag nearby
  // so re-enabling the <GlobalSearch /> block only requires uncommenting both sections.
  // const isGlobalSearchDisabled =
  //   Boolean(searchTerm?.trim()) ||
  //   Boolean(teamSearchTerm?.trim()) ||
  //   Boolean(subTeamSearchTerm?.trim()) ||
  //   Boolean(unitSearchTerm?.trim());

  const clearGlobalSearchState = () => {
    setSearchMatches([]);
    setActiveMatchIndex(-1);
  };

  const handleBusinessUnitSearchChange = (value: string) => {
    setSearchTerm(value);
    clearGlobalSearchState();
  };

  const handleTeamSearchChange = (value: string) => {
    setTeamSearchTerm(value);
    clearGlobalSearchState();
  };

  const handleSubTeamSearchChange = (value: string) => {
    setSubTeamSearchTerm(value);
    clearGlobalSearchState();
  };

  const handleUnitSearchChange = (value: string) => {
    setUnitSearchTerm(value);
    clearGlobalSearchState();
  };

  useEffect(() => {
    if (!currentMatch) {
      setSelectedBusinessUnitId(null);
      setSelectedTeamId(null);
      setSelectedSubTeamId(null);
      setSelectedUnitId(null);
      return;
    }

    setSelectedBusinessUnitId(currentMatch.buId as number | null);
    setSelectedTeamId(currentMatch.teamId as number | null);
    setSelectedSubTeamId(currentMatch.subTeamId as number | null);
    setSelectedUnitId(currentMatch.unitId as number | null);
  }, [currentMatch]);

  if (showOrgSkeleton || orgItemState.state === State.Idle || orgItemState.state === State.Loading) {
    return <SplitViewSkeleton />;
  }

  if (orgItemState.state === State.Failed || !orgItems) {
    return <ErrorHandler message={"An unknown error occurred when fetching org items"} />;
  }

  const selectedTeams =
    orgItems.businessUnits.find((bu) => bu.id === selectedBusinessUnitId)?.teams ?? null;

  const selectedSubTeams =
    selectedTeams?.find((team) => team.id === selectedTeamId)?.subTeams ?? null;

  const selectedUnits =
    selectedSubTeams?.find((subTeam) => subTeam.id === selectedSubTeamId)?.units ?? null;

  const selectedBusinessUnit =
    orgItems.businessUnits.find((bu) => bu.id === selectedBusinessUnitId) ?? null;

  const selectedTeam = selectedTeams?.find((team) => team.id === selectedTeamId) ?? null;

  const selectedSubTeam =
    selectedSubTeams?.find((subTeam) => subTeam.id === selectedSubTeamId) ?? null;

  const handleClose = () => {
    setEditModal({
      open: false,
      uniqueId: null,
      type: null,
    });
  };

  const handleAddModalClose = () => {
    setAddModal({
      open: false,
      data: null,
      type: null,
      selectedNode: null,
    });
  };

  const onEdit = (data: OrgStructureState, nodeType: NodeType) => {
    setEditModal({
      open: true,
      uniqueId: data.uniqueId,
      type: nodeType,
    });
  };

  const onAdd = (
    data: AddOption[] | null,
    nodeType: NodeType,
    selectedNode: CompanyState | BusinessUnitState | TeamState | SubTeamState | UnitState | null,
  ) => {
    if (!data) return;

    setAddModal({
      open: true,
      data: data,
      type: nodeType,
      selectedNode: selectedNode,
    });
  };

  const handleBusinessUnitClick = (bu: BusinessUnitState) => {
    if (selectedBusinessUnitId === bu.id) {
      setSelectedBusinessUnitId(null);
      setSelectedTeamId(null);
      setSelectedSubTeamId(null);
    } else {
      setSelectedBusinessUnitId(bu.id);
      setSelectedTeamId(null);
      setSelectedSubTeamId(null);
    }
  };

  const handleTeamClick = (team: TeamState) => {
    if (selectedTeamId === team.id) {
      setSelectedTeamId(null);
      setSelectedSubTeamId(null);
    } else {
      setSelectedTeamId(team.id);
      setSelectedSubTeamId(null);
    }
  };

  const handleSubTeamClick = (subTeam: SubTeamState) => {
    if (selectedSubTeamId === subTeam.id) {
      setSelectedSubTeamId(null);
    } else {
      setSelectedSubTeamId(subTeam.id);
    }
  };

  const handleUnitClick = (unit: UnitState) => {
    if (selectedUnitId === unit.id) {
      setSelectedUnitId(null);
    } else {
      setSelectedUnitId(unit.id);
    }
  };

  const filteredBusinessUnits =
    orgItems.businessUnits.filter((bu) => {
      if (!searchTerm || searchTerm.trim() === "") return true;

      return bu.name.toLowerCase().includes(searchTerm.toLowerCase());
    }) || [];

  const filteredTeams =
    selectedTeams?.filter((team) => {
      if (!teamSearchTerm || teamSearchTerm.trim() === "") return true;

      return team.name.toLowerCase().includes(teamSearchTerm.toLowerCase());
    }) || [];

  const filteredSubTeams =
    selectedSubTeams?.filter((subTeam) => {
      if (!subTeamSearchTerm || subTeamSearchTerm.trim() === "") return true;

      return subTeam.name.toLowerCase().includes(subTeamSearchTerm.toLowerCase());
    }) || [];

  const filteredUnits =
    selectedUnits?.filter((unit) => {
      if (!unitSearchTerm || unitSearchTerm.trim() === "") return true;

      return unit.name.toLowerCase().includes(unitSearchTerm.toLowerCase());
    }) || [];

  // Add handlers
  const handleBusinessUnitAdd = () => {
    onAdd([], NodeType.BusinessUnit, orgItems.company);
  };

  const handleTeamAdd = () => {
    if (!selectedBusinessUnit || !orgItems) return;
    const data = buildAddModalOptions(NodeType.Team, selectedBusinessUnit, teams);
    if (!data) return;
    onAdd(data, NodeType.Team, selectedBusinessUnit);
  };

  const handleSubTeamAdd = () => {
    if (!selectedTeam || !orgItems) return;
    const data = buildAddModalOptions(NodeType.SubTeam, selectedTeam, subTeams);
    if (!data) return;
    onAdd(data, NodeType.SubTeam, selectedTeam);
  };

  const handleUnitAdd = () => {
    if (!selectedSubTeam || !orgItems) return;
    const data = buildAddModalOptions(NodeType.Unit, selectedSubTeam, units);
    if (!data) return;
    onAdd(data, NodeType.Unit, selectedSubTeam);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Temporarily remove the global search */}
      {/* <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <GlobalSearch
          isDisabled={isGlobalSearchDisabled}
          orgItems={orgItems}
          searchMatches={searchMatches}
          activeMatchIndex={activeMatchIndex}
          setSearchMatches={setSearchMatches}
          setActiveMatchIndex={setActiveMatchIndex}
        />
      </Box> */}

      <Box sx={{ width: "100%", display: "flex", gap: 2 }}>
        <SplitViewColumn
          title="Business Unit"
          placeholder="Search business units"
          nodeType={NodeType.BusinessUnit}
          searchTerm={searchTerm ?? null}
          selectedOrgItemId={selectedBusinessUnitId}
          onAdd={handleBusinessUnitAdd}
          onSearch={handleBusinessUnitSearchChange}
          onEdit={onEdit}
          onClick={handleBusinessUnitClick}
          orgItems={filteredBusinessUnits}
        />

        <SplitViewColumn
          title="Teams"
          placeholder="Search teams"
          nodeType={NodeType.Team}
          searchTerm={teamSearchTerm ?? null}
          selectedOrgItemId={selectedTeamId}
          isSearchDisabled={!selectedBusinessUnitId}
          isAddDisabled={!selectedBusinessUnitId}
          onAdd={handleTeamAdd}
          onSearch={handleTeamSearchChange}
          onEdit={onEdit}
          onClick={handleTeamClick}
          orgItems={filteredTeams}
        />

        <SplitViewColumn
          title="Sub Teams"
          placeholder="Search sub teams"
          nodeType={NodeType.SubTeam}
          searchTerm={subTeamSearchTerm ?? null}
          selectedOrgItemId={selectedSubTeamId}
          isSearchDisabled={!selectedTeamId}
          isAddDisabled={!selectedTeamId}
          onAdd={handleSubTeamAdd}
          onSearch={handleSubTeamSearchChange}
          onEdit={onEdit}
          onClick={handleSubTeamClick}
          orgItems={filteredSubTeams}
        />

        <SplitViewColumn
          title="Units"
          placeholder="Search units"
          nodeType={NodeType.Unit}
          searchTerm={unitSearchTerm ?? null}
          selectedOrgItemId={selectedUnitId}
          isSearchDisabled={!selectedSubTeamId}
          isAddDisabled={!selectedSubTeamId}
          onAdd={handleUnitAdd}
          onSearch={handleUnitSearchChange}
          onEdit={onEdit}
          onClick={handleUnitClick}
          orgItems={filteredUnits}
        />
      </Box>

      {editModal.open && editModal.uniqueId && editModal.type && (
        <EditModal
          open={editModal.open}
          uniqueId={editModal.uniqueId}
          nodeType={editModal.type}
          onClose={handleClose}
        />
      )}

      {addModal.open && addModal.data && addModal.type && addModal.selectedNode && (
        <AddModal
          open={addModal.open}
          orgInfo={addModal.data}
          onClose={handleAddModalClose}
          nodeType={addModal.type}
          selectedNode={addModal.selectedNode}
        />
      )}
    </Box>
  );
}
