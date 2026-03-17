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
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { useState } from "react";

import ErrorHandler from "@root/src/component/common/ErrorHandler.tsx";
import PreLoader from "@root/src/component/common/PreLoader.tsx";
import { RootState, useAppSelector } from "@root/src/slices/store";
import { NodeType } from "@root/src/utils/types";
import { useGetOrgStructureQuery } from "@services/organization";
import type { OrgStructure } from "@services/organization";
import { State } from "@slices/authSlice/auth.ts";
import {
  BusinessUnitState,
  OrgStructureState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";
import { EditModal } from "@view/master-data/components/EditModal";
import OrgStructureCard from "@view/master-data/panel/chart-view/components/OrgStructureCard";

import AddPage from "./AddPage.tsx";
import { useFindMappingId, useFindParentMappingId } from "./hooks/useFindParent";
import { type MatchSearch, itemToMatchSearch } from "./utils/utils.ts";

type OnEdit = {
  open: boolean;
  data: OrgStructure | null;
  type: NodeType | null;
  parentId: string | null;
};

type OnAdd = {
  open: boolean;
  data: BusinessUnitState[] | TeamState[] | SubTeamState[] | UnitState[] | null;
  type: NodeType | null;
  parentId: string | null;
};

export default function SplitView() {
  useGetOrgStructureQuery();

  const orgItemState = useAppSelector((state: RootState) => state.organizationStructure);
  const orgItems = orgItemState.organizationInfo;

  const theme = useTheme();
  const [editModal, setEditModal] = useState<OnEdit>({
    open: false,
    data: null,
    type: null,
    parentId: null,
  });

  const [addModal, setAddModal] = useState<OnAdd>({
    open: false,
    data: null,
    type: null,
    parentId: null,
  });

  const [searchTerm, setSearchTerm] = useState<string | null>();
  const [teamSearchTerm, setTeamSearchTerm] = useState<string | null>();
  const [subTeamSearchTerm, setSubTeamSearchTerm] = useState<string | null>();
  const [unitSearchTerm, setUnitSearchTerm] = useState<string | null>();
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");
  const [searchMatches, setSearchMatches] = useState<MatchSearch[]>([]);

  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSubTeamId, setSelectedSubTeamId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  if (orgItemState.state === State.Loading) {
    return <PreLoader isLoading message="We are retrieving org data" />;
  }

  if (!orgItems || orgItemState.state === State.Failed) {
    return <ErrorHandler message={"An unknown error occurred when fetching org items"} />;
  }

  const selectedTeams =
    orgItems.businessUnits.find((bu) => bu.id === selectedBusinessUnitId)?.teams ?? null;

  const selectedSubTeams =
    selectedTeams?.find((team) => team.id === selectedTeamId)?.subTeams ?? null;

  const selectedUnits =
    selectedSubTeams?.find((subTeam) => subTeam.id === selectedSubTeamId)?.units ?? null;

  const handleClose = () => {
    setEditModal({
      open: false,
      data: null,
      type: null,
      parentId: null,
    });
  };

  const handleAddModalClose = () => {
    setAddModal({
      open: false,
      data: null,
      type: null,
      parentId: null,
    });
  };

  const onEdit = (data: OrgStructureState, nodeType: NodeType) => {
    const parentId = useFindParentMappingId(orgItems, data.parentId, nodeType);

    setEditModal({
      open: true,
      data: data,
      type: nodeType,
      parentId: parentId,
    });
  };

  const onAdd = (
    data: BusinessUnitState[] | TeamState[] | SubTeamState[] | UnitState[] | null,
    nodeType: NodeType,
    parentId: string,
  ) => {
    const parentMappingId = useFindMappingId(orgItems, parentId, nodeType);

    setAddModal({
      open: true,
      data: data,
      type: nodeType,
      parentId: parentMappingId,
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
    onAdd(orgItems.businessUnits, NodeType.BusinessUnit, orgItems.company.id);
  };

  const handleTeamAdd = () => {
    if (!selectedBusinessUnitId) return;
    onAdd(selectedTeams, NodeType.Team, selectedBusinessUnitId);
  };

  const handleSubTeamAdd = () => {
    if (!selectedTeamId) return;
    onAdd(selectedSubTeams, NodeType.SubTeam, selectedTeamId);
  };

  const handleUnitAdd = () => {
    if (!selectedSubTeamId) return;
    onAdd(selectedUnits, NodeType.Unit, selectedSubTeamId);
  };

  // Global search handlers
  const handleGlobalSearch = () => {
    if (!globalSearchTerm.trim()) {
      setSearchMatches([]);
      return;
    }

    const term = globalSearchTerm.toLowerCase();
    const allOrgItems = [
      ...orgItems.businessUnits,
      ...orgItems.teams,
      ...orgItems.subTeams,
      ...orgItems.units,
    ];

    const matches = allOrgItems.filter((item) => item.name.toLowerCase().includes(term));
    const searchResults: MatchSearch[] = matches.map((match) => itemToMatchSearch(orgItems, match));

    setSearchMatches(searchResults);
  };

  const handleClearGlobalSearch = () => {
    console.log("clear global search");
    setGlobalSearchTerm("");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
        <TextField
          placeholder="Search..."
          value={globalSearchTerm}
          onChange={(e) => setGlobalSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleGlobalSearch();
            }
          }}
          size="small"
          sx={{
            backgroundColor: theme.palette.surface.secondary.active,
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={16} color={theme.palette.customText.primary.p3.active} />
                </InputAdornment>
              ),
              endAdornment: globalSearchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearGlobalSearch}
                    sx={{
                      padding: 0,
                      color: theme.palette.customText.primary.p3.active,
                      "&:hover": {
                        color: theme.palette.customText.primary.p2.active,
                      },
                    }}
                  >
                    <ClearIcon sx={{ fontSize: "16px" }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />

        {/* Right: prev / next chevrons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <ChevronLeftIcon
            size={14}
            color={theme.palette.customText.primary.p3.active}
            style={{ cursor: "pointer" }}
          />
          {/* Result counter: 1 / 3 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {["1", "/", "3"].map((token, i) => (
              <Typography
                variant="caption"
                key={i}
                sx={{
                  color: theme.palette.customText.primary.p3.active,
                }}
              >
                {token}
              </Typography>
            ))}
          </Box>
          <ChevronRightIcon
            size={12}
            color={theme.palette.customText.primary.p3.active}
            style={{ cursor: "pointer" }}
          />
        </Box>
      </Box>

      <Box sx={{ width: "100%", display: "flex", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            borderRadius: 1,
            backgroundColor: theme.palette.surface.secondary.active,
          }}
        >
          <Box
            sx={{
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.customText.primary.p2.active,
                textAlign: "center",
              }}
            >
              Business Unit
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", p: 2 }}>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                gap: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextField
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search business units"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ margin: 0 }}>
                        <SearchIcon size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: "100%",
                }}
              />
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
                  px: "6px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={handleBusinessUnitAdd}
              >
                <AddIcon sx={{ color: theme.palette.customText.primary.p3.active }} />
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              {filteredBusinessUnits.map((bu) => (
                <OrgStructureCard
                  key={bu.id}
                  name={bu.name}
                  headCount={bu.headCount}
                  hasChildren={Boolean(bu.head || bu.functionalLead)}
                  togglePeopleSectionVisibility={true}
                  teamHead={bu.head}
                  functionLead={bu.functionalLead}
                  onEdit={() => onEdit(bu, NodeType.BusinessUnit)}
                  onClick={() => handleBusinessUnitClick(bu)}
                  isPeopleSectionVertical={true}
                  isHighlighted={selectedBusinessUnitId === bu.id}
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            borderRadius: 1,
            backgroundColor: theme.palette.surface.secondary.active,
          }}
        >
          <Box
            sx={{
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.customText.primary.p2.active,
                textAlign: "center",
              }}
            >
              Teams
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", p: 2 }}>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                gap: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextField
                value={teamSearchTerm}
                onChange={(e) => setTeamSearchTerm(e.target.value)}
                placeholder="Search teams"
                disabled={!selectedBusinessUnitId}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ margin: 0 }}>
                        <SearchIcon size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: "100%",
                }}
              />
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
                  px: "6px",
                  borderRadius: "6px",
                  cursor: selectedBusinessUnitId ? "pointer" : "not-allowed",
                  opacity: selectedBusinessUnitId ? 1 : 0.4,
                  pointerEvents: selectedBusinessUnitId ? "auto" : "none",
                }}
                onClick={handleTeamAdd}
              >
                <AddIcon sx={{ color: theme.palette.customText.primary.p3.active }} />
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              {filteredTeams.map((team) => (
                <OrgStructureCard
                  key={team.id}
                  name={team.name}
                  headCount={team.headCount}
                  hasChildren={Boolean(team.head || team.functionalLead)}
                  togglePeopleSectionVisibility={true}
                  teamHead={team.head}
                  functionLead={team.functionalLead}
                  onEdit={() => onEdit(team, NodeType.Team)}
                  onClick={() => handleTeamClick(team)}
                  isPeopleSectionVertical={true}
                  isHighlighted={selectedTeamId === team.id}
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            borderRadius: 1,
            backgroundColor: theme.palette.surface.secondary.active,
          }}
        >
          <Box
            sx={{
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.customText.primary.p2.active,
                textAlign: "center",
              }}
            >
              Sub Teams
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", p: 2 }}>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                gap: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextField
                value={subTeamSearchTerm}
                onChange={(e) => setSubTeamSearchTerm(e.target.value)}
                placeholder="Search sub teams"
                disabled={!selectedTeamId}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ margin: 0 }}>
                        <SearchIcon size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: "100%",
                }}
              />
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
                  px: "6px",
                  borderRadius: "6px",
                  cursor: selectedTeamId ? "pointer" : "not-allowed",
                  opacity: selectedTeamId ? 1 : 0.4,
                  pointerEvents: selectedTeamId ? "auto" : "none",
                }}
                onClick={handleSubTeamAdd}
              >
                <AddIcon sx={{ color: theme.palette.customText.primary.p3.active }} />
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              {filteredSubTeams.map((subTeam) => (
                <OrgStructureCard
                  key={subTeam.id}
                  name={subTeam.name}
                  headCount={subTeam.headCount}
                  hasChildren={Boolean(subTeam.head || subTeam.functionalLead)}
                  togglePeopleSectionVisibility={true}
                  teamHead={subTeam.head}
                  functionLead={subTeam.functionalLead}
                  onEdit={() => onEdit(subTeam, NodeType.SubTeam)}
                  onClick={() => handleSubTeamClick(subTeam)}
                  isPeopleSectionVertical={true}
                  isHighlighted={selectedSubTeamId === subTeam.id}
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            borderRadius: 1,
            backgroundColor: theme.palette.surface.secondary.active,
          }}
        >
          <Box
            sx={{
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.customText.primary.p2.active,
                textAlign: "center",
              }}
            >
              Units
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", p: 2 }}>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                gap: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextField
                value={unitSearchTerm}
                onChange={(e) => setUnitSearchTerm(e.target.value)}
                placeholder="Search units"
                disabled={!selectedSubTeamId}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ margin: 0 }}>
                        <SearchIcon size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: "100%",
                }}
              />
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
                  px: "6px",
                  borderRadius: "6px",
                  cursor: selectedSubTeamId ? "pointer" : "not-allowed",
                  opacity: selectedSubTeamId ? 1 : 0.4,
                  pointerEvents: selectedSubTeamId ? "auto" : "none",
                }}
                onClick={handleUnitAdd}
              >
                <AddIcon sx={{ color: theme.palette.customText.primary.p3.active }} />
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              {filteredUnits.map((unit) => (
                <OrgStructureCard
                  key={unit.id}
                  name={unit.name}
                  headCount={unit.headCount}
                  hasChildren={Boolean(unit.head || unit.functionalLead)}
                  togglePeopleSectionVisibility={true}
                  teamHead={unit.head}
                  functionLead={unit.functionalLead}
                  onEdit={() => onEdit(unit, NodeType.Unit)}
                  isPeopleSectionVertical={true}
                  onClick={() => handleUnitClick(unit)}
                  isHighlighted={selectedUnitId === unit.id}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {editModal.open && editModal.data && editModal.type && editModal.parentId !== null && (
        <EditModal
          open={editModal.open}
          data={editModal.data}
          type={editModal.type}
          parentId={editModal.parentId}
          onClose={handleClose}
        />
      )}

      <AddPage
        open={addModal.open}
        orgInfo={addModal.data}
        onClose={handleAddModalClose}
        nodeType={addModal.type}
        parentId={addModal.parentId}
      />
    </Box>
  );
}
