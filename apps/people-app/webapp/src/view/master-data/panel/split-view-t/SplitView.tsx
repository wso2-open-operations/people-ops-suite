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
import { Box, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { SearchIcon } from "lucide-react";

import { useState } from "react";

import { RootState, useAppSelector } from "@root/src/slices/store";
import { NodeType } from "@root/src/utils/types";
import {
  BusinessUnit,
  Company,
  SubTeam,
  Team,
  useGetOrgStructureQuery,
} from "@services/organization";
import type { OrgStructure } from "@services/organization";
import {
  BusinessUnitState,
  OrgStructureState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";
import { EditModal } from "@view/master-data/components/EditModal";
import OrgStructureCard from "@view/master-data/panel/chart-view/components/OrgStructureCard";
import AddPage from "./AddPage.tsx"

import useFindParent from "./hooks/useFindParent";

type OnEdit = {
  open: boolean;
  data: OrgStructure | null;
  type: NodeType | null;
  parentNode: Company | BusinessUnit | Team | SubTeam | null;
};

type OnAdd = {
  open: boolean;
  data: BusinessUnitState[] | TeamState[] | SubTeamState[] | UnitState[] | null;
  type: NodeType | null
}

export default function SplitView() {
  const orgItems = useAppSelector(
    (state: RootState) => state.organizationStructure.organizationInfo,
  );


  const { data: orgStructure } = useGetOrgStructureQuery();

  const theme = useTheme();
  const [editModal, setEditModal] = useState<OnEdit>({
    open: false,
    data: null,
    type: null,
    parentNode: null,
  });

  const [addModal, setAddModal] = useState<OnAdd>({
    open: false,
    data: null,
    type: null
  });

  const [searchTerm, setSearchTerm] = useState<string | null>();
  const [teamSearchTerm, setTeamSearchTerm] = useState<string | null>();
  const [subTeamSearchTerm, setSubTeamSearchTerm] = useState<string | null>();
  const [unitSearchTerm, setUnitSearchTerm] = useState<string | null>();

  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSubTeamId, setSelectedSubTeamId] = useState<string | null>(null);

  const [selectedTeams, setSelectedTeams] = useState<TeamState[] | null>(null);
  const [selectedSubTeams, setSelectedSubTeams] = useState<SubTeamState[] | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<UnitState[] | null>(null);

  const handleClose = () => {
    setEditModal({
      open: false,
      data: null,
      type: null,
      parentNode: null,
    });
  };

  const handleAddModalClose = () => {
    setAddModal({
      open: false,
      data: null,
      type: null
    });
  }

  const onEdit = (data: OrgStructureState, nodeType: NodeType) => {
    const parent = useFindParent(orgItems, data.parentId);

    setEditModal({
      open: true,
      data: data,
      type: nodeType,
      parentNode: parent,
    });
  };

  const onAdd = (data: BusinessUnitState[] | TeamState[] | SubTeamState[] | UnitState[] | null, nodeType: NodeType) => {
    setAddModal({
      open: true,
      data: data,
      type: nodeType,
    });
  };

  const handleBusinessUnitClick = (bu: BusinessUnitState) => {
    // If clicking the same BU, deselect it
    if (selectedBusinessUnitId === bu.id) {
      setSelectedTeams(null);
      setSelectedBusinessUnitId(null);
      setSelectedSubTeams(null);
      setSelectedTeamId(null);
      setSelectedUnits(null);
      setSelectedSubTeamId(null);
    } else {
      // Otherwise, select the new BU's teams
      setSelectedTeams(bu.teams);
      setSelectedBusinessUnitId(bu.id);
      setSelectedSubTeams(null);
      setSelectedTeamId(null);
      setSelectedUnits(null);
      setSelectedSubTeamId(null);
    }
  };

  const handleTeamClick = (team: TeamState) => {
    if (selectedTeamId === team.id) {
      setSelectedSubTeams(null);
      setSelectedTeamId(null);
      setSelectedUnits(null);
      setSelectedSubTeamId(null);
    } else {
      setSelectedSubTeams(team.subTeams);
      setSelectedTeamId(team.id);
      setSelectedUnits(null);
      setSelectedSubTeamId(null);
    }
  };

  const handleSubTeamClick = (subTeam: SubTeamState) => {
    if (selectedSubTeamId === subTeam.id) {
      setSelectedUnits(null);
      setSelectedSubTeamId(null);
    } else {
      setSelectedUnits(subTeam.units);
      setSelectedSubTeamId(subTeam.id);
    }
  };

  const filteredBusinessUnits =
    orgItems?.businessUnits.filter((bu) => {
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

  if (!orgItems) return;

  const handleBusinessUnitAdd = () => {
    console.log("click business unit add");
    onAdd(orgItems.businessUnits, NodeType.BusinessUnit);
  };

  const handleTeamAdd = () => {
    console.log("click team add");
    onAdd(orgItems.teams, NodeType.BusinessUnit);
  };

  const handleSubTeamAdd = () => {
    console.log("click sub team add");
    onAdd(orgItems.subTeams, NodeType.BusinessUnit);
  };

  const handleUnitAdd = () => {
    console.log("click unit add");
    onAdd(orgItems.units, NodeType.BusinessUnit);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box>
        <Typography>remaking split view</Typography>
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
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {editModal.open && editModal.data && editModal.type && (
        <EditModal
          open={editModal.open}
          data={editModal.data}
          type={editModal.type}
          parentNode={editModal.parentNode}
          onClose={handleClose}
        />
      )}

      <AddPage open={addModal.open} orgInfo={addModal.data} onClose={handleAddModalClose} />

      {/* {/* Add modal */}
      {/* {addModal.context && ( */}
      {/*   <AddPage */}
      {/*     open={addModal.open} */}
      {/*     context={addModal.context} */}
      {/*     onClose={handleCloseAdd} */}
      {/*     onSubmit={(_ctx, _values) => { */}
      {/*       handleCloseAdd(); */}
      {/*     }} */}
      {/*   /> */}
      {/* )} */}
      {/**/}
    </Box>
  );
}
