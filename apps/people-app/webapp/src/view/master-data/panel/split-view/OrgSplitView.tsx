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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";

import { useEffect, useMemo, useRef, useState } from "react";

import ErrorHandler from "@component/common/ErrorHandler";
import PreLoader from "@component/common/PreLoader";
import {
  BusinessUnit,
  Company,
  SubTeam,
  Team,
  Unit,
  useGetOrgStructureQuery,
} from "@services/organization";
import { UnitType } from "@utils/utils";

import AddPage, { AddPageContext } from "@view/master-data/components/AddPage"
import { EditModal } from "@view/master-data/components/EditModal";
import { CollapsibleOrgCard } from "./components/CollapsibleOrgCard";
import { OrgSectionColumn } from "./components/OrgSectionColumn";
import { useGlobalOrgSearch } from "./hooks/useGlobalOrgSearch";
import { OrgSearchNode, buildGlobalOrgSearchIndex } from "./utils/globalOrgSearch";
import {
  filterBusinessUnits,
  filterSubTeams,
  filterTeams,
  filterUnits,
  searchOrgItem,
} from "./utils/searchUtils";

type ExpandableNodeType = "BUSINESS_UNIT" | "TEAM" | "SUB_TEAM" | "UNIT";

export default function OrgSplitView() {
  const theme = useTheme();
  const { data: orgStructure, isLoading, isError } = useGetOrgStructureQuery();

  const [buSearch, setBuSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [subTeamSearch, setSubTeamSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");

  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedSubTeam, setSelectedSubTeam] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const searchSelectionSnapshotRef = useRef<{
    selectedBU: string | null;
    selectedTeam: string | null;
    selectedSubTeam: string | null;
    selectedUnit: string | null;
  } | null>(null);
  const wasSearchActiveRef = useRef(false);

  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: Company | BusinessUnit | Team | SubTeam | Unit | null;
    type: UnitType | null;
    parentNode: Company | BusinessUnit | Team | SubTeam | null;
  }>({
    open: false,
    data: null,
    type: null,
    parentNode: null,
  });

  const [addModal, setAddModal] = useState<{
    open: boolean;
    context: AddPageContext | null;
  }>({
    open: false,
    context: null,
  });

  const businessUnits = useMemo(() => orgStructure?.businessUnits || [], [orgStructure]);

  const getExpandKey = (type: ExpandableNodeType, id: string) => `${type}:${id}`;
  const getRefKey = (type: ExpandableNodeType, id: string) => `${type}:${id}`;
  const getRefKeyFromMatch = (match: OrgSearchNode) => {
    if (match.type === "business_unit") return getRefKey("BUSINESS_UNIT", match.id);
    if (match.type === "team") return getRefKey("TEAM", match.id);
    if (match.type === "sub_team") return getRefKey("SUB_TEAM", match.id);
    return getRefKey("UNIT", match.id);
  };
  const globalSearchIndex = useMemo(
    () => buildGlobalOrgSearchIndex(businessUnits),
    [businessUnits],
  );
  const {
    inputValue: globalSearchInput,
    setInputValue: setGlobalSearchInput,
    activeQuery: globalSearch,
    hasResults: searchHasResults,
    currentIndex: searchCurrentIndex,
    totalResults: searchTotalResults,
    currentMatch: searchCurrentResult,
    executeSearch: executeGlobalSearch,
    goToNext: searchGoNext,
    goToPrevious: searchGoPrev,
    clearSearch: clearGlobalSearch,
  } = useGlobalOrgSearch(globalSearchIndex);

  const filteredBusinessUnits = useMemo(() => {
    return filterBusinessUnits(businessUnits, buSearch);
  }, [businessUnits, buSearch]);

  const currentTeams = useMemo(() => {
    if (!selectedBU) return [];
    const bu = businessUnits.find((b) => b.id === selectedBU);
    return bu?.teams || [];
  }, [businessUnits, selectedBU]);

  const filteredTeams = useMemo(() => {
    return filterTeams(currentTeams, teamSearch);
  }, [currentTeams, teamSearch]);

  const currentSubTeams = useMemo(() => {
    if (!selectedTeam) return [];
    const team = currentTeams.find((t) => t.id === selectedTeam);
    return team?.subTeams || [];
  }, [currentTeams, selectedTeam]);

  const filteredSubTeams = useMemo(() => {
    return filterSubTeams(currentSubTeams, subTeamSearch);
  }, [currentSubTeams, subTeamSearch]);

  const currentUnits = useMemo(() => {
    if (!selectedSubTeam) return [];
    const subTeam = currentSubTeams.find((st) => st.id === selectedSubTeam);
    return subTeam?.units || [];
  }, [currentSubTeams, selectedSubTeam]);

  const filteredUnits = useMemo(() => {
    return filterUnits(currentUnits, unitSearch);
  }, [currentUnits, unitSearch]);

  const hasGlobalSearch = Boolean(globalSearch);
  const hasBusinessUnitSearch = Boolean(buSearch.trim());
  const hasTeamSearch = Boolean(teamSearch.trim());
  const hasSubTeamSearch = Boolean(subTeamSearch.trim());
  const hasUnitSearch = Boolean(unitSearch.trim());
  const hasAnySearch =
    hasGlobalSearch || hasBusinessUnitSearch || hasTeamSearch || hasSubTeamSearch || hasUnitSearch;

  useEffect(() => {
    if (hasGlobalSearch && !wasSearchActiveRef.current) {
      searchSelectionSnapshotRef.current = {
        selectedBU,
        selectedTeam,
        selectedSubTeam,
        selectedUnit,
      };
    }

    if (!hasGlobalSearch && wasSearchActiveRef.current && searchSelectionSnapshotRef.current) {
      const snapshot = searchSelectionSnapshotRef.current;
      setSelectedBU(snapshot.selectedBU);
      setSelectedTeam(snapshot.selectedTeam);
      setSelectedSubTeam(snapshot.selectedSubTeam);
      setSelectedUnit(snapshot.selectedUnit);
      searchSelectionSnapshotRef.current = null;
    }

    wasSearchActiveRef.current = hasGlobalSearch;
  }, [hasGlobalSearch, selectedBU, selectedTeam, selectedSubTeam, selectedUnit]);

  useEffect(() => {
    if (searchCurrentResult && businessUnits.length > 0) {
      const result = searchCurrentResult;

      setSelectedBU(result.businessUnitId);

      if (result.type === "business_unit") {
        setSelectedTeam(null);
        setSelectedSubTeam(null);
        setSelectedUnit(null);
      } else if (result.type === "team") {
        setSelectedTeam(result.teamId || null);
        setSelectedSubTeam(null);
        setSelectedUnit(null);
      } else if (result.type === "sub_team") {
        setSelectedTeam(result.teamId || null);
        setSelectedSubTeam(result.subTeamId || null);
        setSelectedUnit(null);
      } else {
        setSelectedTeam(result.teamId || null);
        setSelectedSubTeam(result.subTeamId || null);
        setSelectedUnit(result.id);
      }

      setTimeout(() => {
        const element = cardRefs.current.get(getRefKeyFromMatch(result));
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [searchCurrentResult]);

  const toggleExpand = (expandKey: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(expandKey)) {
        next.delete(expandKey);
      } else {
        next.add(expandKey);
      }
      return next;
    });
  };

  const handleBusinessUnitSelect = (businessUnitId: string) => {
    if (selectedBU === businessUnitId) {
      setSelectedBU(null);
      setSelectedTeam(null);
      setSelectedSubTeam(null);
      setSelectedUnit(null);
      return;
    }

    setSelectedBU(businessUnitId);
    setSelectedTeam(null);
    setSelectedSubTeam(null);
    setSelectedUnit(null);
  };

  const handleTeamSelect = (teamId: string) => {
    if (selectedTeam === teamId) {
      setSelectedTeam(null);
      setSelectedSubTeam(null);
      setSelectedUnit(null);
      return;
    }

    setSelectedTeam(teamId);
    setSelectedSubTeam(null);
    setSelectedUnit(null);
  };

  const handleSubTeamSelect = (subTeamId: string) => {
    if (selectedSubTeam === subTeamId) {
      setSelectedSubTeam(null);
      setSelectedUnit(null);
      return;
    }

    setSelectedSubTeam(subTeamId);
    setSelectedUnit(null);
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit((prev) => (prev === unitId ? null : unitId));
  };

  const highlightedGlobalBusinessUnitId =
    hasGlobalSearch && searchCurrentResult?.type === "business_unit"
      ? searchCurrentResult.id
      : null;
  const highlightedGlobalTeamId =
    hasGlobalSearch && searchCurrentResult?.type === "team" ? searchCurrentResult.id : null;
  const highlightedGlobalSubTeamId =
    hasGlobalSearch && searchCurrentResult?.type === "sub_team" ? searchCurrentResult.id : null;
  const highlightedGlobalUnitId =
    hasGlobalSearch && searchCurrentResult?.type === "unit" ? searchCurrentResult.id : null;

  const handleClearGlobalSearch = () => {
    clearGlobalSearch();
  };

  const findNodeById = (
    id: string,
    type: string,
  ): {
    node: Company | BusinessUnit | Team | SubTeam | Unit;
    parentNode: Company | BusinessUnit | Team | SubTeam | null;
  } | null => {
    if (!orgStructure) return null;

    if (type === "BUSINESS_UNIT") {
      const bu = businessUnits.find((b) => b.id === id);
      return bu ? { node: bu, parentNode: orgStructure } : null;
    }

    if (type === "TEAM") {
      for (const bu of businessUnits) {
        const team = bu.teams?.find((t) => t.id === id);
        if (team) return { node: team, parentNode: bu };
      }
    }

    if (type === "SUB_TEAM") {
      for (const bu of businessUnits) {
        for (const team of bu.teams || []) {
          const subTeam = team.subTeams?.find((st) => st.id === id);
          if (subTeam) return { node: subTeam, parentNode: team };
        }
      }
    }

    if (type === "UNIT") {
      for (const bu of businessUnits) {
        for (const team of bu.teams || []) {
          for (const subTeam of team.subTeams || []) {
            const unit = subTeam.units?.find((u) => u.id === id);
            if (unit) return { node: unit, parentNode: subTeam };
          }
        }
      }
    }

    return null;
  };

  const handleEdit = (id: string, type: string) => {
    const result = findNodeById(id, type);
    if (result) {
      setEditModal({
        open: true,
        data: result.node,
        type: type as UnitType,
        parentNode: result.parentNode,
      });
    }
  };

  const handleClose = () => {
    setEditModal({
      open: false,
      data: null,
      type: null,
      parentNode: null,
    });
  };

  const handleOpenAdd = (context: AddPageContext) => {
    setAddModal({ open: true, context });
  };

  const handleCloseAdd = () => {
    setAddModal({ open: false, context: null });
  };

  if (isLoading) {
    return <PreLoader isLoading message="Loading organization structure ..." />;
  }

  if (isError) {
    return <ErrorHandler message="Failed to load organization structure" />;
  }

  if (!orgStructure) {
    return <ErrorHandler message="No organization structure data available" />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "12px",
        // padding: "16px",
      }}
    >
      {/* Global Search */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
        {searchHasResults && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <IconButton
              onClick={searchGoPrev}
              size="small"
              sx={{
                width: "32px",
                height: "32px",
                color: theme.palette.customText.primary.p3.active,
                "&:hover": {
                  backgroundColor: theme.palette.fill.neutral.light.hover,
                },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: "20px" }} />
            </IconButton>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.customText.primary.p3.active,
                fontSize: "14px",
                minWidth: "50px",
                textAlign: "center",
              }}
            >
              {searchCurrentIndex} / {searchTotalResults}
            </Typography>

            <IconButton
              onClick={searchGoNext}
              size="small"
              sx={{
                width: "32px",
                height: "32px",
                color: theme.palette.customText.primary.p3.active,
                "&:hover": {
                  backgroundColor: theme.palette.fill.neutral.light.hover,
                },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: "20px" }} />
            </IconButton>
          </Box>
        )}

        <TextField
          placeholder="Search..."
          value={globalSearchInput}
          onChange={(e) => setGlobalSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              executeGlobalSearch();
            }
          }}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: theme.palette.customText.primary.p3.active,
                    fontSize: "16px",
                  }}
                />
              </InputAdornment>
            ),
            endAdornment: globalSearchInput ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClearGlobalSearch}
                  size="small"
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
          }}
          sx={{
            width: "287px",
            "& .MuiOutlinedInput-root": {
              backgroundColor: theme.palette.fill.neutral.light.active,
              height: "40px",
              borderRadius: "8px",
              "& fieldset": {
                borderColor: theme.palette.customBorder.primary.b3.active,
              },
              "&:hover fieldset": {
                borderColor: theme.palette.customBorder.primary.b3.hover,
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
              },
            },
            "& .MuiInputBase-input": {
              color: theme.palette.customText.primary.p3.active,
              fontSize: "14px",
              padding: "8px 12px",
              "&::placeholder": {
                color: theme.palette.customText.primary.p3.active,
                opacity: 1,
              },
            },
          }}
        />
      </Box>

      {/* 4-Column Split View */}
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Business Units */}
        <OrgSectionColumn
          title="Business Units"
          searchValue={buSearch}
          onSearchChange={setBuSearch}
          onAdd={() =>
            handleOpenAdd({
              childType: UnitType.BusinessUnit,
              parentId: orgStructure.id,
              parentName: orgStructure.name,
              parentType: UnitType.Company,
            })
          }
        >
          {filteredBusinessUnits.map((bu) => (
            <Box
              key={bu.id}
              ref={(el: HTMLDivElement | null) => {
                cardRefs.current.set(getRefKey("BUSINESS_UNIT", bu.id), el);
              }}
            >
              <CollapsibleOrgCard
                name={bu.name}
                headCount={bu.headCount}
                head={bu.head}
                functionalLead={bu.functionalLead}
                isExpanded={expandedCards.has(getExpandKey("BUSINESS_UNIT", bu.id))}
                isHighlighted={
                  hasGlobalSearch
                    ? highlightedGlobalBusinessUnitId === bu.id
                    : hasBusinessUnitSearch
                      ? searchOrgItem(bu, buSearch)
                      : hasAnySearch
                        ? false
                        : selectedBU === bu.id
                }
                onToggleExpand={() => toggleExpand(getExpandKey("BUSINESS_UNIT", bu.id))}
                onSelect={() => handleBusinessUnitSelect(bu.id)}
                onEdit={() => handleEdit(bu.id, "BUSINESS_UNIT")}
              />
            </Box>
          ))}
        </OrgSectionColumn>

        {/* Teams */}
        <OrgSectionColumn
          title="Teams"
          searchValue={teamSearch}
          onSearchChange={setTeamSearch}
          onAdd={
            selectedBU
              ? () => {
                const bu = businessUnits.find((b) => b.id === selectedBU);
                if (bu) {
                  handleOpenAdd({
                    childType: UnitType.Team,
                    parentId: bu.id,
                    parentName: bu.name,
                    parentType: UnitType.BusinessUnit,
                  });
                }
              }
              : undefined
          }
        >
          {filteredTeams.map((team) => (
            <Box
              key={team.id}
              ref={(el: HTMLDivElement | null) => {
                cardRefs.current.set(getRefKey("TEAM", team.id), el);
              }}
            >
              <CollapsibleOrgCard
                name={team.name}
                headCount={team.headCount}
                head={team.head}
                functionalLead={team.functionalLead}
                isExpanded={expandedCards.has(getExpandKey("TEAM", team.id))}
                isHighlighted={
                  hasGlobalSearch
                    ? highlightedGlobalTeamId === team.id
                    : hasTeamSearch
                      ? searchOrgItem(team, teamSearch)
                      : hasAnySearch
                        ? false
                        : selectedTeam === team.id
                }
                onToggleExpand={() => toggleExpand(getExpandKey("TEAM", team.id))}
                onSelect={() => handleTeamSelect(team.id)}
                onEdit={() => handleEdit(team.id, "TEAM")}
              />
            </Box>
          ))}
        </OrgSectionColumn>

        {/* Sub Teams */}
        <OrgSectionColumn
          title="Sub Teams"
          searchValue={subTeamSearch}
          onSearchChange={setSubTeamSearch}
          onAdd={
            selectedTeam
              ? () => {
                const team = currentTeams.find((t) => t.id === selectedTeam);
                if (team) {
                  handleOpenAdd({
                    childType: UnitType.SubTeam,
                    parentId: team.id,
                    parentName: team.name,
                    parentType: UnitType.Team,
                  });
                }
              }
              : undefined
          }
        >
          {filteredSubTeams.map((subTeam) => (
            <Box
              key={subTeam.id}
              ref={(el: HTMLDivElement | null) => {
                cardRefs.current.set(getRefKey("SUB_TEAM", subTeam.id), el);
              }}
            >
              <CollapsibleOrgCard
                name={subTeam.name}
                headCount={subTeam.headCount}
                head={subTeam.head}
                functionalLead={subTeam.functionalLead}
                isExpanded={expandedCards.has(getExpandKey("SUB_TEAM", subTeam.id))}
                isHighlighted={
                  hasGlobalSearch
                    ? highlightedGlobalSubTeamId === subTeam.id
                    : hasSubTeamSearch
                      ? searchOrgItem(subTeam, subTeamSearch)
                      : hasAnySearch
                        ? false
                        : selectedSubTeam === subTeam.id
                }
                onToggleExpand={() => toggleExpand(getExpandKey("SUB_TEAM", subTeam.id))}
                onSelect={() => handleSubTeamSelect(subTeam.id)}
                onEdit={() => handleEdit(subTeam.id, "SUB_TEAM")}
              />
            </Box>
          ))}
        </OrgSectionColumn>

        {/* Units */}
        <OrgSectionColumn
          title="Units"
          searchValue={unitSearch}
          onSearchChange={setUnitSearch}
          onAdd={
            selectedSubTeam
              ? () => {
                const subTeam = currentSubTeams.find((st) => st.id === selectedSubTeam);
                if (subTeam) {
                  handleOpenAdd({
                    childType: UnitType.Unit,
                    parentId: subTeam.id,
                    parentName: subTeam.name,
                    parentType: UnitType.SubTeam,
                  });
                }
              }
              : undefined
          }
        >
          {filteredUnits.map((unit) => (
            <Box
              key={unit.id}
              ref={(el: HTMLDivElement | null) => {
                cardRefs.current.set(getRefKey("UNIT", unit.id), el);
              }}
            >
              <CollapsibleOrgCard
                name={unit.name}
                headCount={unit.headCount}
                head={unit.head}
                functionalLead={unit.functionalLead}
                isExpanded={expandedCards.has(getExpandKey("UNIT", unit.id))}
                isHighlighted={
                  hasGlobalSearch
                    ? highlightedGlobalUnitId === unit.id
                    : hasUnitSearch
                      ? searchOrgItem(unit, unitSearch)
                      : hasAnySearch
                        ? false
                        : selectedUnit === unit.id
                }
                onToggleExpand={() => toggleExpand(getExpandKey("UNIT", unit.id))}
                onSelect={() => handleUnitSelect(unit.id)}
                onEdit={() => handleEdit(unit.id, "UNIT")}
              />
            </Box>
          ))}
        </OrgSectionColumn>
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

      {/* Add modal */}
      {addModal.context && (
        <AddPage
          open={addModal.open}
          context={addModal.context}
          onClose={handleCloseAdd}
          onSubmit={(_ctx, _values) => {
            handleCloseAdd();
          }}
        />
      )}
    </Box>
  );
}
