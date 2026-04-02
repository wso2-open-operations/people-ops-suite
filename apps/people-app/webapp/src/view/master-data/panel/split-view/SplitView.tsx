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
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { useEffect, useState } from "react";

import ErrorHandler from "@component/common/ErrorHandler.tsx";
import { SPLIT_VIEW_SKELETON_DELAY_MS } from "@root/src/config/constant.ts";
import { useMinimumLoadingVisibility } from "@root/src/hooks/useMinimumLoadingVisibility.ts";
import { buildAddModalOptions } from "@root/src/utils/utils.ts";
import OrgStructureCard from "@root/src/view/master-data/components/OrgStructureCard.tsx";
import { useGetOrgStructureQuery } from "@services/organization";
import { State } from "@slices/authSlice/auth.ts";
import {
  BusinessUnitState,
  OrgStructureState,
  OrganizationInfo,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";
import { RootState, store, useAppSelector } from "@slices/store";
import { NodeType } from "@utils/types";
import { EditModal } from "@view/master-data/components/EditModal";

import AddModal from "../../components/AddModal.tsx";
import SplitViewSkeleton from "./components/SplitViewSkeleton.tsx";
import { type MatchSearch, itemToMatchSearch } from "./utils/globalSearch.ts";

/** Match header `MIN_GLOBAL_LOADING_INDICATOR_MS` — hide skeleton until loading is sustained this long. */

type OnEdit = {
  open: boolean;
  uniqueId: string | null;
  type: NodeType | null;
};

export type AddOption = (BusinessUnitState | TeamState | SubTeamState | UnitState) & {
  canAdd?: boolean;
};

type OnAdd = {
  open: boolean;
  data: AddOption[] | null;
  type: NodeType | null;
  selectedNode: BusinessUnitState | TeamState | SubTeamState | UnitState | null;
};

export default function SplitView() {
  useGetOrgStructureQuery();

  const orgItemState = useAppSelector((state: RootState) => state.organizationStructure);
  const orgItems = orgItemState.organizationInfo;

  const showOrgSkeleton = useMinimumLoadingVisibility(
    orgItemState.state === State.Loading && !orgItems,
    SPLIT_VIEW_SKELETON_DELAY_MS,
  );

  const theme = useTheme();
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
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");
  const [searchMatches, setSearchMatches] = useState<MatchSearch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1);

  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSubTeamId, setSelectedSubTeamId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const currentMatch = activeMatchIndex >= 0 ? searchMatches[activeMatchIndex] : null;

  const goToPreviousMatch = () => {
    setActiveMatchIndex((i) =>
      searchMatches.length ? (i - 1 + searchMatches.length) % searchMatches.length : -1,
    );
  };

  const goToNextMatch = () => {
    setActiveMatchIndex((i) => (searchMatches.length ? (i + 1) % searchMatches.length : -1));
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

  // Only show the full skeleton on initial load (no cached org structure yet).
  // For background refreshes, keep rendering the current view to avoid UI flicker/unmounting modals.
  if (showOrgSkeleton || orgItemState.state === State.Idle) {
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
    selectedNode: BusinessUnitState | TeamState | SubTeamState | UnitState | null,
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
    onAdd([], NodeType.BusinessUnit, null);
  };

  const handleTeamAdd = () => {
    if (!selectedBusinessUnit || !orgItems) return;
    const data = buildAddModalOptions(NodeType.Team, selectedBusinessUnit, orgItems);
    if (!data) return;
    onAdd(data, NodeType.Team, selectedBusinessUnit);
  };

  const handleSubTeamAdd = () => {
    if (!selectedTeam || !orgItems) return;
    const data = buildAddModalOptions(NodeType.SubTeam, selectedTeam, orgItems);
    if (!data) return;
    onAdd(data, NodeType.SubTeam, selectedTeam);
  };

  const handleUnitAdd = () => {
    if (!selectedSubTeam || !orgItems) return;
    const data = buildAddModalOptions(NodeType.Unit, selectedSubTeam, orgItems);
    if (!data) return;
    onAdd(data, NodeType.Unit, selectedSubTeam);
  };

  // Global search handlers
  const handleGlobalSearch = () => {
    if (!globalSearchTerm.trim()) {
      setSearchMatches([]);
      setActiveMatchIndex(-1);
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
    setActiveMatchIndex(searchResults.length ? 0 : -1);
  };

  const handleClearGlobalSearch = () => {
    setGlobalSearchTerm("");
    setSearchMatches([]);
    setActiveMatchIndex(-1);
  };

  const isDisabled = Boolean(searchTerm || teamSearchTerm || subTeamSearchTerm || unitSearchTerm);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Temporarily commenting the global search functionality */}
      {/* <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}> */}
      {/*   <Tooltip */}
      {/*     placement="top" */}
      {/*     title={isDisabled ? "Clear other filters to enable global search" : ""} */}
      {/*     disableHoverListener={!isDisabled} */}
      {/*     disableFocusListener={!isDisabled} */}
      {/*     disableTouchListener={!isDisabled} */}
      {/*   > */}
      {/*     <TextField */}
      {/*       placeholder="Search..." */}
      {/*       value={globalSearchTerm} */}
      {/*       onChange={(e) => setGlobalSearchTerm(e.target.value)} */}
      {/*       disabled={isDisabled} */}
      {/*       onKeyDown={(e) => { */}
      {/*         if (e.key === "Enter") { */}
      {/*           e.preventDefault(); */}
      {/*           handleGlobalSearch(); */}
      {/*         } */}
      {/*       }} */}
      {/*       size="small" */}
      {/*       sx={{ */}
      {/*         backgroundColor: theme.palette.surface.secondary.active, */}
      {/*       }} */}
      {/*       slotProps={{ */}
      {/*         input: { */}
      {/*           startAdornment: ( */}
      {/*             <InputAdornment position="start"> */}
      {/*               <SearchIcon size={16} color={theme.palette.customText.primary.p3.active} /> */}
      {/*             </InputAdornment> */}
      {/*           ), */}
      {/*           endAdornment: globalSearchTerm ? ( */}
      {/*             <InputAdornment position="end"> */}
      {/*               <IconButton */}
      {/*                 size="small" */}
      {/*                 onClick={handleClearGlobalSearch} */}
      {/*                 sx={{ */}
      {/*                   padding: 0, */}
      {/*                   color: theme.palette.customText.primary.p3.active, */}
      {/*                   "&:hover": { */}
      {/*                     color: theme.palette.customText.primary.p2.active, */}
      {/*                   }, */}
      {/*                 }} */}
      {/*               > */}
      {/*                 <ClearIcon sx={{ fontSize: "16px" }} /> */}
      {/*               </IconButton> */}
      {/*             </InputAdornment> */}
      {/*           ) : null, */}
      {/*         }, */}
      {/*       }} */}
      {/*     /> */}
      {/*   </Tooltip> */}
      {/*   {/* Right: prev / next chevrons */}
      {/*   {searchMatches.length > 0 ? ( */}
      {/*     <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}> */}
      {/*       <ChevronLeftIcon */}
      {/*         size={14} */}
      {/*         color={theme.palette.customText.primary.p3.active} */}
      {/*         onClick={goToPreviousMatch} */}
      {/*         style={{ cursor: "pointer" }} */}
      {/*       /> */}
      {/*       <Box */}
      {/*         sx={{ */}
      {/*           display: "flex", */}
      {/*           alignItems: "center", */}
      {/*           gap: "4px", */}
      {/*         }} */}
      {/*       > */}
      {/*         {[String(activeMatchIndex + 1), "/", String(searchMatches.length)].map((token, i) => ( */}
      {/*           <Typography */}
      {/*             variant="caption" */}
      {/*             key={i} */}
      {/*             sx={{ */}
      {/*               color: theme.palette.customText.primary.p3.active, */}
      {/*             }} */}
      {/*           > */}
      {/*             {token} */}
      {/*           </Typography> */}
      {/*         ))} */}
      {/*       </Box> */}
      {/*       <ChevronRightIcon */}
      {/*         size={12} */}
      {/*         color={theme.palette.customText.primary.p3.active} */}
      {/*         onClick={goToNextMatch} */}
      {/*         style={{ cursor: "pointer" }} */}
      {/*       /> */}
      {/*     </Box> */}
      {/*   ) : null} */}
      {/* </Box> */}

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
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm("")}
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
                  hasChildren={Boolean(bu.head)}
                  togglePeopleSectionVisibility={true}
                  teamHead={bu.head}
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
                    endAdornment: teamSearchTerm ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setTeamSearchTerm("")}
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
                    endAdornment: subTeamSearchTerm ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSubTeamSearchTerm("")}
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
                    endAdornment: unitSearchTerm ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setUnitSearchTerm("")}
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

      {editModal.open && editModal.uniqueId && editModal.type && (
        <EditModal
          open={editModal.open}
          uniqueId={editModal.uniqueId}
          nodeType={editModal.type}
          onClose={handleClose}
        />
      )}

      {addModal.open && addModal.data && addModal.type && (
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
