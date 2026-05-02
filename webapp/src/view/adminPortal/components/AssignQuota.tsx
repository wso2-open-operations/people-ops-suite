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

import React, { useEffect, useRef, useState } from "react";

import dayjs from "dayjs";
import { object, number, string, array } from "yup";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridRenderCellParams, GridRowSelectionModel, useGridApiRef } from "@mui/x-data-grid";

import { shortDateFormat, SnackMessage, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { ConfirmationType } from "@/types/types";
import { RequestState, GroupedTeams, SpecialQuotaTeam } from "@utils/types";

import { useAppDispatch, useAppSelector } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { fetchConfigurations } from "@slices/metaSlice/meta";
import {
  fetchOpenParCycle,
  openParCycle,
  selectCurrentCycle,
  selectParCycleState,
} from "@slices/parCycleSlice/parCycle";
import {
  PostSpecialQuotaTeam,
  SpecialRatingQuota,
  fetchQuotaGroups,
  postQuotaGroups,
  resetQuotaSate,
  selectQuotaGroups,
  selectQuotaGroupsStatus,
} from "@slices/specialQuotaSlice/specialQuota";

import { DataGridToolbar } from "@component/common/DataGridToolbar";
import EditQuotaDialog from "@component/common/EditQuotaDialog";
import InputDialog from "@component/common/GroupNameInputDialog";
import NoDataView from "@component/common/NoDataView";
import QuotaChip from "@component/common/QuotaStatusChip";
import ErrorComponent from "@component/ui/ErrorComponent";
import { LoadingEffect } from "@component/ui/Loading";
import { useConfirmationModalContext } from "@context/DialogContext";

export const AssignQuota = () => {
  const dispatch = useAppDispatch();
  const groups = useAppSelector(selectQuotaGroups);
  const dialogContext = useConfirmationModalContext();
  const currentCycle = useAppSelector(selectCurrentCycle);
  const quotaGroupStatus = useAppSelector(selectQuotaGroupsStatus);
  const parCyclesLoadingState = useAppSelector(selectParCycleState);
  const groupNamesRef = useRef<string[]>([]);
  const groupsWithIssuesRef = useRef<string[]>([]);
  const apiController = useRef(new AbortController());
  const editableGroupRef = useRef<number | null>(null);
  const parentGroupIdRef = useRef<number | null>(null);
  const teamToBeRemovedRef = useRef<number | null>(null);
  const groupToBeRemovedRef = useRef<number | null>(null);
  const calculateTotalHeads = (teams: SpecialQuotaTeam[]) =>
    teams.reduce((sum, team) => sum + (team?.headCount || 0), 0);
  const totalEmployees = calculateTotalHeads(groups);
  const [top5SlotsAvailable, setTop5SlotsAvailable] = useState<number>(0);
  const [top5SlotsAllocated, setTop5SlotsAllocated] = useState<number>(0);
  const [top20SlotsAllocated, setTop20SlotsAllocated] = useState<number>(0);
  const [top20SlotsAvailable, setTop20SlotsAvailable] = useState<number>(0);
  const [searchText, setSearchText] = useState("");
  const [groupIdCounter, setGroupIdCounter] = useState(0);
  const [isGroupMapEmpty, setIsGroupMapEmpty] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isTeamsTableEmpty, setIsTeamsTableEmpty] = useState(false);
  const [isDataSubmitting, setIsDataSubmitting] = useState(false);
  const [isQuotaDialogOpen, setIsQuotaDialogOpen] = useState(false);
  const [groupMappings, setGroupMappings] = useState<GroupedTeams[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<SpecialQuotaTeam[]>([]);
  const teamsApiRef = useGridApiRef();
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({ type: "include", ids: new Set() });
  const [isGroupExpanded, setIsGroupExpanded] = useState<number | false>(false);
  const [groupToAssignSlots, setGroupToAssignSlots] = useState<GroupedTeams | null>(null);
  const [menuState, setMenuState] = useState<{
    anchorEl: null | HTMLElement;
    group: null | GroupedTeams;
  }>({
    anchorEl: null,
    group: null,
  });

  const renderTextCell = (params: GridRenderCellParams) => (
    <Tooltip title={String(params.value ?? "")} enterDelay={500} enterNextDelay={500}>
      <Typography variant="body2" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
        {params.value ?? "—"}
      </Typography>
    </Tooltip>
  );

  const columns = [
    { field: "businessUnit", headerName: "BU", flex: 0.15, renderCell: renderTextCell },
    { field: "department", headerName: "Department", flex: 0.35, renderCell: renderTextCell },
    { field: "team", headerName: "Team", flex: 0.35, renderCell: renderTextCell },
    { field: "headCount", headerName: "Heads", flex: 0.15 },
  ];

  const groupSchema = object().shape({
    id: number()
      .required("ID is required")
      .test("Total Headcount must be a valid number", (value) => isValidNumber(value))
      .integer(),
    allocated5Slots: number()
      .required("Allocated 5 Slots is required")
      .test(
        "is-valid-number",
        "Allocated 5% Slots must be a valid number",
        (value) => isValidNumber(value) && value >= 0
      )
      .test(
        "max-allocated5Slots",
        "Allocated 5% Slots must not exceed the default 5% value or total headcount",
        function (value) {
          const { default5Slots } = this.parent;
          return isValidNumber(value) && value <= default5Slots;
        }
      )
      .integer(),
    allocated20Slots: number()
      .required("Allocated 20% Slots is required")
      .test(
        "is-valid-number",
        "Allocated 20% Slots must be a valid number",
        (value) => isValidNumber(value) && value >= 0
      )
      .test(
        "max-allocated20Slots",
        "Allocated 20% Slots must not exceed the default 20% value or total headcount",
        function (value) {
          const { default20Slots } = this.parent;
          return isValidNumber(value) && value <= default20Slots;
        }
      )
      .integer(),
    default5Slots: number()
      .required("Default 5% Slots is required")
      .test("is-valid-number", "Default 5% Slots must be a valid number", (value) => isValidNumber(value) && value >= 0)
      .test("correct-default5Slots", "Default 5% Slots must match 5% of the total headcount", function (value) {
        const { totalHeadCount } = this.parent;
        const calculatedValues = calculateDefaultQuotaValues(totalHeadCount);
        return value === calculatedValues.default5Slots;
      })
      .positive()
      .integer(),
    default20Slots: number()
      .required("Default 20% Slots is required")
      .test("Default 20% Slots must be a valid number", (value) => isValidNumber(value) && value >= 0)
      .test("correct-default5Slots", "Default 20% Slots must match 20% of the total headcount", function (value) {
        const { totalHeadCount } = this.parent;
        const calculatedValues = calculateDefaultQuotaValues(totalHeadCount);
        return value === calculatedValues.default20Slots;
      })
      .min(0)
      .integer(),
    totalHeadCount: number()
      .required("Total Headcount is required")
      .test("Total Headcount must be a valid number", (value) => isValidNumber(value) && value >= 0)
      .positive()
      .integer(),
  });

  const specialRatingQuotaSchema = object().shape({
    specialRatingQuotaId: number().required("Special Rating Quota ID is required").min(0).integer(),
    specialRatingQuotaName: string().required("Special Rating Quota Name is required"),
    top5pQuota: number().required("Top 5% Quota is required").min(0).integer(),
    top20pQuota: number().required("Top 20% Quota is required").min(0).integer(),
    allocatedLeads: array()
      .of(string().required())
      .required()
      .min(1, "A minimum of one lead must be assigned to each rating group"),
  });

  const postSpecialQuotaGroupSchema = object().shape({
    parCycleId: number().required("PAR Cycle ID is required").positive().integer(),
    specialRatingGroupId: number().required("Special Rating Group ID is required").positive().integer(),
    businessUnit: string().required("Business Unit is required"),
    department: string().required("Department is required"),
    team: string().defined(),
    specialRatingQuotaId: number().required("Special Rating Quota ID is required").min(0).integer(),
  });

  const handleCollapseToggle = (groupId: number) => {
    editableGroupRef.current = editableGroupRef.current === groupId ? null : groupId;
  };

  const handleOpenNameDialog = () => {
    setIsNameDialogOpen(true);
  };

  const handleCloseNameDialog = () => {
    setIsNameDialogOpen(false);
  };

  const handleOpenQuotaDialog = () => {
    setIsQuotaDialogOpen(true);
  };

  const handleCloseQuotaDialog = () => {
    setIsQuotaDialogOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, group: GroupedTeams) => {
    event.preventDefault();
    setMenuState({ anchorEl: event.currentTarget, group });
  };

  const handleMenuClose = () => {
    setMenuState({ anchorEl: null, group: null });
  };

  const handleSummaryClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  const handleSaveGroupName = (name: string) => {
    handleGroupCreation(name);
    handleCloseNameDialog();
  };

  const handleSelectionChange = (newSelectionModel: GridRowSelectionModel) => {
    setSelectionModel(newSelectionModel);
  };

  const handleGroupExpand = (panel: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setIsGroupExpanded(isExpanded ? panel : false);
  };

  const isValidNumber = (value: any): value is number => value !== null && value !== undefined && !isNaN(value);

  useEffect(() => {
    const calculateSlotTotals = (key: "default5Slots" | "default20Slots" | "allocated5Slots" | "allocated20Slots") =>
      groupMappings.reduce((sum, group) => sum + (group[key] as number), 0);

    const totalTop5Available = calculateSlotTotals("default5Slots");
    const totalTop20Available = calculateSlotTotals("default20Slots");
    const totalTop5Allocated = calculateSlotTotals("allocated5Slots");
    const totalTop20Allocated = calculateSlotTotals("allocated20Slots");

    setTop5SlotsAvailable(totalTop5Available);
    setTop20SlotsAvailable(totalTop20Available);
    setTop5SlotsAllocated(totalTop5Allocated);
    setTop20SlotsAllocated(totalTop20Allocated);

    setIsGroupMapEmpty(groupMappings.length === 0);
  }, [groupMappings]);

  useEffect(() => {
    if (currentCycle.parCycleId) {
      apiController.current = new AbortController();
      dispatch(
        fetchQuotaGroups({
          parCycleId: currentCycle.parCycleId,
          signal: apiController.current.signal,
        })
      );
    }
    dispatch(fetchConfigurations());
  }, [currentCycle.parCycleId]);

  useEffect(() => {
    if (quotaGroupStatus === RequestState.SUCCEEDED) {
      dispatch(resetQuotaSate());
    }
  }, [quotaGroupStatus]);

  useEffect(() => {
    if (filteredTeams.length === 0) {
      setIsTeamsTableEmpty(true);
    } else {
      setIsTeamsTableEmpty(false);
    }
  }, [filteredTeams]);

  useEffect(() => {
    if (groupMappings.length === 0) {
      const transformedGroups = groups.map((group) => {
        return {
          ...group,
          department: group.department
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" "),
        };
      });
      setFilteredTeams(transformedGroups);
    }
  }, [groups, groupMappings]);

  useEffect(() => {
    if (!isGroupMapEmpty || groupMappings.length > 0) {
      const groupedTeamIds = groupMappings.flatMap((group) => group.teams.map((team) => team.specialRatingGroupId));

      const names = groupMappings.map((group) => group.name);
      groupNamesRef.current = names;

      setFilteredTeams((prevTeams) => prevTeams.filter((team) => !groupedTeamIds.includes(team.specialRatingGroupId)));
    }
  }, [groupMappings]);

  const openRemoveTeamDialog = () => {
    dialogContext.showConfirmation(
      uiMessages.dialog.confirmTeamRemove.title,
      uiMessages.dialog.confirmTeamRemove.message,
      ConfirmationType.accept,
      handleRemoveTeam,
      uiMessages.dialog.confirmTeamRemove.okText,
      "Cancel"
    );
  };

  const openConfirmChoiceDialog = () => {
    const message = `${uiMessages.dialog.confirmQuotaAssign.message}${groupsWithIssuesRef.current.length > 0 ? ` Under Served Groups : ${groupsWithIssuesRef.current.join(", ")}` : ""
      }`;
    dialogContext.showConfirmation(
      uiMessages.dialog.confirmQuotaAssign.title,
      message,
      ConfirmationType.accept,
      confirmAndProceed,
      uiMessages.dialog.confirmQuotaAssign.okText,
      "Cancel"
    );
  };

  const openRemoveGroupDialog = () => {
    dialogContext.showConfirmation(
      uiMessages.dialog.confirmGroupRemove.title,
      uiMessages.dialog.confirmGroupRemove.message,
      ConfirmationType.accept,
      removeGroupFromGroupMap,
      uiMessages.dialog.confirmGroupRemove.okText,
      "Cancel"
    );
  };

  const calculateDefaultQuotaValues = (totalHeadCount: number) => {
    let default5Slots = Math.round(totalHeadCount * 0.05);
    let default20Slots = Math.round(totalHeadCount * 0.2);

    if (default5Slots === 0 && default20Slots === 0 && totalHeadCount > 0) {
      return { default5Slots: 1, default20Slots: 0 };
    }

    if (default5Slots < 1) {
      default5Slots = 1;
    }

    if (default20Slots < 1) {
      default20Slots = 1;
    }

    if (default20Slots - default5Slots >= 0) {
      default20Slots -= default5Slots;
    }

    return {
      default5Slots,
      default20Slots,
    };
  };

  const handleGroupCreation = (name: string) => {
    const selectedTeams: SpecialQuotaTeam[] =
      selectionModel.type === "exclude"
        ? filteredTeams.filter((team) => !selectionModel.ids.has(team.specialRatingGroupId))
        : (Array.from(selectionModel.ids)
            .map((id) => filteredTeams.find((team) => team.specialRatingGroupId === id))
            .filter(Boolean) as SpecialQuotaTeam[]);

    if (selectedTeams.length > 0) {

      const totalHeadCount = calculateTotalHeads(selectedTeams);
      const { default5Slots, default20Slots } = calculateDefaultQuotaValues(totalHeadCount);

      const updatedTeams = selectedTeams.map((team) => ({
        ...team,
        groupNumber: groupIdCounter,
      }));

      const newGroup: GroupedTeams = {
        id: groupIdCounter,
        teams: updatedTeams,
        default5Slots: default5Slots,
        default20Slots: default20Slots,
        allocated5Slots: default5Slots,
        allocated20Slots: default20Slots,
        totalHeadCount: totalHeadCount,
        name: name,
        allocatedLeads: [],
      };

      setGroupMappings((prevGroups) => [...prevGroups, newGroup]);
      setSelectionModel({ type: "include", ids: new Set() });
      setGroupIdCounter((prevCounter) => prevCounter + 1);
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.groupCreated, type: "success" }));
    }
  };

  const handleAssignQuotaValues = (group: GroupedTeams) => {
    setGroupMappings((prevMapping) => {
      const groupIndex = prevMapping.findIndex((g) => g.id === group.id);
      if (groupIndex !== -1) {
        return prevMapping.map((g, index) => (index === groupIndex ? group : g));
      } else {
        return [...prevMapping, group];
      }
    });
    handleCloseQuotaDialog();
  };

  const resetGroupQuota = (groupID: number) => {
    if (editableGroupRef.current === groupID) {
      handleCollapseToggle(groupID);
    }
    groupMappings.forEach((group) => {
      if (group.id === groupID) {
        group.allocated5Slots = group.default5Slots;
        group.allocated20Slots = group.default20Slots;
      }
    });

    setGroupMappings([...groupMappings]);
  };

  const updateTeamsGroupNumber = (groupIdToRemove: number | null) => {
    return groups.map((team) => {
      if (groupIdToRemove === null) {
        return team;
      }
      if (
        groupMappings.some(
          (group) =>
            group.id === groupIdToRemove &&
            group.teams.some((t) => t.specialRatingGroupId === team.specialRatingGroupId)
        )
      ) {
        return { ...team, groupNumber: null };
      }
      return team;
    });
  };

  const removeGroupFromGroupMap = () => {
    const groupToRemove = groupMappings.find((group) => group.id === groupToBeRemovedRef.current);
    if (groupToRemove) {
      const updatedTeams = updateTeamsGroupNumber(groupToBeRemovedRef.current);
      setFilteredTeams(updatedTeams);
      const updatedGroupMappings = groupMappings.filter((group) => group.id !== groupToBeRemovedRef.current);
      setGroupMappings(updatedGroupMappings);
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.groupRemoved, type: "success" }));
    }
  };

  const handleRemoveTeam = () => {
    const updatedGroups = removeTeamFromGroup();
    const nonEmptyGroups = filterEmptyGroups(updatedGroups);
    dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.teamRemoved, type: "success" }));
    setGroupMappings(nonEmptyGroups);
  };

  const removeTeamFromGroup = () => {
    const updatedGroups = groupMappings.map((group) => {
      if (group.id === parentGroupIdRef.current) {
        const updatedTeams = group.teams.filter((team) => team.specialRatingGroupId !== teamToBeRemovedRef.current);
        const updatedTotalHeadCount = calculateTotalHeads(updatedTeams);
        const { default5Slots, default20Slots } = calculateDefaultQuotaValues(updatedTotalHeadCount);
        return {
          ...group,
          teams: updatedTeams,
          totalHeadCount: updatedTotalHeadCount,
          default5Slots,
          default20Slots,
          allocated5Slots: Math.min(group.allocated5Slots, default5Slots),
          allocated20Slots: Math.min(group.allocated20Slots, default20Slots),
        };
      }
      return group;
    });

    const updatedTeams = updateTeamsGroupNumber(null);
    setFilteredTeams(updatedTeams);
    return updatedGroups;
  };

  const filterEmptyGroups = (groups: GroupedTeams[]) => {
    const nonEmptyGroups = groups.filter((group) => {
      if (group.teams.length === 0) {
        return false;
      }
      return true;
    });
    return nonEmptyGroups;
  };

  const validateGroupMap = () => {
    if (!isTeamsTableEmpty) {
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.error.groupAssignIncomplete, type: "error" }));
      return false;
    }
    try {
      array().of(groupSchema).validateSync(groupMappings, { abortEarly: false });
      groupsWithIssuesRef.current = getUnderServedGroupNames(groupMappings);
      openConfirmChoiceDialog();
      return true;
    } catch (_) {
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.error.groupValidationFailed, type: "error" }));
      return false;
    }
  };

  const getUnderServedGroupNames = (groupMappings: GroupedTeams[]): string[] => {
    return groupMappings
      .map((group) => {
        const has5SlotIssue =
          group.allocated5Slots === 0 || group.allocated5Slots < group.default5Slots;
        const has20SlotIssue =
          group.allocated20Slots === 0 || group.allocated20Slots < group.default20Slots;

        if (has5SlotIssue || has20SlotIssue) {
          return group.name;
        } else {
          return null;
        }
      })
      .filter((groupName) => groupName !== null) as string[];
  };

  const confirmAndProceed = async () => {
    const cycleID = currentCycle?.parCycleId;
    if (cycleID === null || cycleID === undefined) {
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.error.fetchCurrentCycleDetails, type: "error" }));
      return;
    }
    try {
      setIsDataSubmitting(true);
      const isQuotaSaved = await postQuotaData(cycleID);
      if (!isQuotaSaved) {
        setIsDataSubmitting(false);
        return;
      }
      const isCycleUpdated = await updateParCycleStatus(cycleID);
      if (!isCycleUpdated) {
        setIsDataSubmitting(false);
        return;
      }
      dispatch(fetchOpenParCycle());
    } catch (_) {
      setIsDataSubmitting(false);
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.error.common, type: "error" }));
    }
  };

  const formatGroupMappingToPostRequest = () => {
    const parSpecialRatingGroups: PostSpecialQuotaTeam[] = [];
    const specialRatingQuotas: SpecialRatingQuota[] = [];

    groupMappings.forEach((group, index) => {
      const specialRatingQuotaId = index + 1;
      const specialRatingQuota: SpecialRatingQuota = {
        specialRatingQuotaId,
        specialRatingQuotaName: group.name,
        top5pQuota: group.allocated5Slots,
        top20pQuota: group.allocated20Slots,
        allocatedLeads: group.allocatedLeads,
      };

      specialRatingQuotas.push(specialRatingQuota);

      const formattedTeams = group.teams.map(({ groupNumber, headCount, ...rest }) => ({
        parCycleId: rest.parCycleId,
        specialRatingGroupId: rest.specialRatingGroupId,
        businessUnit: rest.businessUnit,
        department: rest.department,
        team: rest.team,
        specialRatingQuotaId: specialRatingQuotaId,
      }));

      parSpecialRatingGroups.push(...formattedTeams);
    });

    return {
      parSpecialRatingGroups,
      specialRatingQuotas,
    };
  };

  const validateQuotaData = async (
    specialRatingQuotas: SpecialRatingQuota[],
    parSpecialRatingGroups: PostSpecialQuotaTeam[]
  ): Promise<{
    isValid: boolean;
    validatedSpecialRatingQuotas: SpecialRatingQuota[];
    validatedParSpecialRatingGroups: PostSpecialQuotaTeam[];
    errorMessages?: string[];
  }> => {
    try {
      const validatedSpecialRatingQuotas =
        (await array().of(specialRatingQuotaSchema).validate(specialRatingQuotas, { abortEarly: false })) || [];

      const validatedParSpecialRatingGroups =
        (await array().of(postSpecialQuotaGroupSchema).validate(parSpecialRatingGroups, { abortEarly: false })) || [];

      return {
        isValid: true,
        validatedSpecialRatingQuotas,
        validatedParSpecialRatingGroups,
      };
    } catch (error) {
      const errorMessages: string[] = [];
      if (error && typeof error === "object" && "inner" in error && Array.isArray((error as any).inner)) {
        (error as any).inner.forEach((err: any) => {
          errorMessages.push(err.message);
        });
      }
      return {
        errorMessages,
        isValid: false,
        validatedSpecialRatingQuotas: [],
        validatedParSpecialRatingGroups: [],
      };
    }
  };

  const postQuotaData = async (cycleID: number): Promise<boolean> => {
    const { parSpecialRatingGroups, specialRatingQuotas } = formatGroupMappingToPostRequest();
    const validationResult = await validateQuotaData(specialRatingQuotas, parSpecialRatingGroups);

    if (!validationResult.isValid) {
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.error.quotValidationError, type: "error" }));
      if (validationResult.errorMessages) {
        validationResult.errorMessages.map((msg) => {
          dispatch(enqueueSnackbarMessage({ message: msg, type: "error" }));
        });
      }

      setIsDataSubmitting(false);
      return false;
    }
    try {
      const resultAction = await dispatch(
        postQuotaGroups({
          parCycleId: cycleID,
          parSpecialRatingGroups: validationResult.validatedParSpecialRatingGroups,
          specialRatingQuotas: validationResult.validatedSpecialRatingQuotas,
        })
      );
      if (postQuotaGroups.fulfilled.match(resultAction)) {
        return true;
      }
    } catch (error) {
      setIsDataSubmitting(false);
      return false;
    }
    return false;
  };

  const updateParCycleStatus = async (cycleID: number): Promise<boolean> => {
    try {
      const resultAction = await dispatch(openParCycle(cycleID));
      if (openParCycle.fulfilled.match(resultAction)) {
        return true;
      }
    } catch (error) {
      setIsDataSubmitting(false);
      return false;
    }
    return false;
  };

  return (
    <Stack sx={{ height: "100%" }}>
      {parCyclesLoadingState === RequestState.SUCCEEDED && (
        <>
          {quotaGroupStatus === RequestState.LOADING && <LoadingEffect message={uiMessages.loading.pageLoading} />}
          {quotaGroupStatus === RequestState.IDLE && isDataSubmitting && (
            <LoadingEffect message={uiMessages.loading.parCycleCreation} />
          )}
          {quotaGroupStatus === RequestState.FAILED && <ErrorComponent />}
          {quotaGroupStatus === RequestState.IDLE && !isDataSubmitting && (
            <Box height="100%" overflow="hidden" display="flex" flexDirection="column">
              {/* Header */}
              <Box
                sx={{
                  flexShrink: 0,
                  bgcolor: "background.default",
                  borderBottom: 1,
                  borderColor: "divider",
                  px: 2,
                  py: 1.5,
                }}
              >
                <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography display="inline" variant="h5" fontWeight={600}>
                      {currentCycle.parCycleName}
                    </Typography>
                    <Typography display="inline" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({dayjs(currentCycle.parCycleStartDate).format(shortDateFormat)} -{" "}
                      {dayjs(currentCycle.parCycleEndDate).format(shortDateFormat)})
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent={{ xs: "flex-start", md: "flex-end" }}
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          Eligible Employees
                        </Typography>
                        <Chip size="small" label={totalEmployees} />
                      </Box>
                      <QuotaChip
                        isHeading
                        type="Top 5%"
                        available={top5SlotsAvailable}
                        allocated={top5SlotsAllocated}
                      />
                      <QuotaChip
                        isHeading
                        type="Top 20%"
                        available={top20SlotsAvailable}
                        allocated={top20SlotsAllocated}
                      />
                      {!isGroupMapEmpty && isTeamsTableEmpty ? (
                        <Tooltip
                          arrow
                          title={uiMessages.tooltip.finishAssignQuotaButtonHelper}
                          enterDelay={tooltipVisibilityDelay}
                          enterNextDelay={tooltipVisibilityDelay}
                        >
                          <Button variant="contained" color="primary" onClick={validateGroupMap}>
                            Save Quota Values
                          </Button>
                        </Tooltip>
                      ) : (
                        <Tooltip
                          arrow
                          title={
                            selectionModel.type === "include" && selectionModel.ids.size === 0
                              ? uiMessages.tooltip.addATeamToGroupHelperDisabled
                              : uiMessages.tooltip.addATeamToGroupHelper
                          }
                          enterDelay={tooltipVisibilityDelay}
                          enterNextDelay={tooltipVisibilityDelay}
                        >
                          <span>
                            <Button
                              variant="contained"
                              onClick={handleOpenNameDialog}
                              disabled={selectionModel.type === "include" && selectionModel.ids.size === 0}
                            >
                              Create a Group
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Content panels */}
              <Box sx={{ flex: 1, minHeight: 0, display: "flex", gap: 2, px: 2, pt: 2, pb: 2, overflow: "hidden" }}>
                {/* Left — group mappings */}
                <Box sx={{ flex: 2, minWidth: 0, minHeight: 0 }}>
                  {!isGroupMapEmpty ? (
                    <Card variant="outlined" sx={{ height: "100%", overflow: "auto" }}>
                      <Box p={1} key={groupIdCounter}>
                        {groupMappings.map((group) => (
                          <Accordion
                            slotProps={{ transition: { unmountOnExit: true } }}
                            key={group.id}
                            expanded={isGroupExpanded === group.id}
                            onChange={handleGroupExpand(group.id)}
                            sx={{ mb: 1 }}
                          >
                            <AccordionSummary
                              aria-controls={`group-${group.id}-content`}
                              id={`group-${group.id}-header`}
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                "&:hover": { bgcolor: "action.hover" },
                                "& .MuiAccordionSummary-expandIconWrapper": { order: -1 },
                              }}
                            >
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flexWrap="wrap"
                                width="100%"
                                onClick={(e) => handleSummaryClick(e)}
                              >
                                <Typography variant="body2" fontWeight={500} sx={{ minWidth: 80 }}>
                                  {group.name}
                                </Typography>
                                <Chip label={`Head Count : ${group.totalHeadCount}`} />
                                <QuotaChip
                                  isHeading
                                  type="5%"
                                  available={group.default5Slots}
                                  allocated={group.allocated5Slots}
                                />
                                <QuotaChip
                                  isHeading
                                  type="20%"
                                  available={group.default20Slots}
                                  allocated={group.allocated20Slots}
                                />
                                <Chip
                                  size="small"
                                  label={
                                    group.allocatedLeads.length > 0
                                      ? `${group.allocatedLeads.length} Lead${group.allocatedLeads.length !== 1 ? "s" : ""} Assigned`
                                      : "No Leads Assigned"
                                  }
                                  variant="outlined"
                                  color={group.allocatedLeads.length > 0 ? "primary" : "error"}
                                  sx={{ fontWeight: 500, minWidth: 130 }}
                                />
                                <Box sx={{ ml: "auto" }}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      handleSummaryClick(e);
                                      handleMenuOpen(e, group);
                                    }}
                                    sx={{
                                      color: "primary.main",
                                      "&:hover": { bgcolor: "primary.main", color: "white" },
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                  <Menu
                                    anchorEl={menuState.anchorEl}
                                    open={Boolean(menuState.anchorEl && menuState.group === group)}
                                    onClose={handleMenuClose}
                                    sx={{ "& .MuiPaper-root": { boxShadow: 2, border: 1, borderColor: "divider" } }}
                                    onClick={(e) => handleSummaryClick(e)}
                                  >
                                    <MenuItem
                                      onClick={(e) => {
                                        handleSummaryClick(e);
                                        handleOpenQuotaDialog();
                                        setGroupToAssignSlots(group);
                                        handleMenuClose();
                                      }}
                                    >
                                      <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                      Edit Group Settings
                                    </MenuItem>
                                    <MenuItem
                                      onClick={(e) => {
                                        handleSummaryClick(e);
                                        resetGroupQuota(group.id);
                                        handleMenuClose();
                                      }}
                                    >
                                      <RestartAltIcon fontSize="small" sx={{ mr: 1 }} />
                                      Reset Quota
                                    </MenuItem>
                                    <MenuItem
                                      onClick={(e) => {
                                        groupToBeRemovedRef.current = group.id;
                                        openRemoveGroupDialog();
                                        handleSummaryClick(e);
                                        handleMenuClose();
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                                      Remove Group
                                    </MenuItem>
                                    <MenuItem
                                      onClick={(e) => {
                                        handleSummaryClick(e);
                                        handleMenuClose();
                                      }}
                                    >
                                      <CloseIcon fontSize="small" sx={{ mr: 1 }} />
                                      Cancel
                                    </MenuItem>
                                  </Menu>
                                </Box>
                              </Box>
                            </AccordionSummary>

                            <AccordionDetails sx={{ p: 0 }}>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      {["BU", "Department", "Team", "Head Count", "Action"].map((h) => (
                                        <TableCell
                                          key={h}
                                          align={h === "Head Count" || h === "Action" ? "center" : "left"}
                                          sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.secondary" }}
                                        >
                                          {h}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.teams.map((team) => (
                                      <TableRow key={team.specialRatingGroupId} hover>
                                        <TableCell sx={{ maxWidth: 100 }}>
                                          <Tooltip title={team.businessUnit ?? ""} enterDelay={500}>
                                            <Typography variant="body2" noWrap>
                                              {team.businessUnit || "—"}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 140 }}>
                                          <Tooltip title={team.department} enterDelay={500}>
                                            <Typography variant="body2" noWrap>
                                              {team.department}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 120 }}>
                                          <Tooltip title={team.team} enterDelay={500}>
                                            <Typography variant="body2" noWrap>
                                              {team.team}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Typography variant="body2">{team.headCount}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Tooltip
                                            arrow
                                            title={uiMessages.tooltip.removeATeamFromGroup}
                                            enterDelay={tooltipVisibilityDelay}
                                            enterNextDelay={tooltipVisibilityDelay}
                                          >
                                            <IconButton
                                              size="small"
                                              sx={{
                                                color: "primary.main",
                                                "&:hover": { bgcolor: "primary.main", color: "white" },
                                              }}
                                              onClick={() => {
                                                parentGroupIdRef.current = group.id;
                                                teamToBeRemovedRef.current = team.specialRatingGroupId;
                                                openRemoveTeamDialog();
                                              }}
                                            >
                                              <DeleteOutlineOutlinedIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                    </Card>
                  ) : (
                    <Card variant="outlined" sx={{ height: "100%", overflow: "hidden" }}>
                      <NoDataView text={uiMessages.information.emptyGroupsView} />
                    </Card>
                  )}
                </Box>

                {/* Right — team selection table */}
                <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                  {isTeamsTableEmpty ? (
                    <Card variant="outlined" sx={{ height: "100%", overflow: "hidden" }}>
                      <NoDataView text={uiMessages.information.emptyTeamsView} />
                    </Card>
                  ) : (
                    <Card variant="outlined" sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          px: 1,
                          py: 0.5,
                          borderBottom: 1,
                          borderColor: "divider",
                        }}
                      >
                        <DataGridToolbar
                          apiRef={teamsApiRef}
                          searchText={searchText}
                          onSearchChange={setSearchText}
                          hideColumns
                          hideDensity
                        />
                      </Box>
                      <DataGrid
                        apiRef={teamsApiRef}
                        sx={{
                          border: "none",
                          "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
                          "& .MuiDataGrid-columnHeader": { pl: 0.5 },
                          "& .MuiDataGrid-cell": { pl: 0.1 },
                          flex: 1,
                        }}
                        density="compact"
                        getRowId={(row) => row.specialRatingGroupId}
                        rows={filteredTeams}
                        columns={columns}
                        rowHeight={44}
                        pageSizeOptions={[10]}
                        checkboxSelection
                        onRowSelectionModelChange={handleSelectionChange}
                        rowSelectionModel={selectionModel}
                        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                      />
                    </Card>
                  )}
                </Box>
              </Box>

              <InputDialog
                open={isNameDialogOpen}
                onClose={handleCloseNameDialog}
                groupNames={groupNamesRef.current}
                onSave={handleSaveGroupName}
              />
              {isQuotaDialogOpen && groupToAssignSlots && (
                <EditQuotaDialog
                  open={isQuotaDialogOpen}
                  onClose={handleCloseQuotaDialog}
                  onSave={handleAssignQuotaValues}
                  groupData={groupToAssignSlots}
                />
              )}
            </Box>
          )}
        </>
      )}
      {parCyclesLoadingState === RequestState.LOADING && <LoadingEffect message={uiMessages.loading.pageLoading} />}
    </Stack>
  );
};
