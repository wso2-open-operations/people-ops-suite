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
import CloseIcon from "@mui/icons-material/Close";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  createFilterOptions,
  useTheme,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import { useEffect, useState } from "react";

import ErrorHandler from "@root/src/component/common/ErrorHandler";
import { SPLIT_VIEW_SKELETON_DELAY_MS } from "@root/src/config/constant";
import { useMinimumLoadingVisibility } from "@root/src/hooks/useMinimumLoadingVisibility";
import { EmployeeBasicInfo, useGetEmployeesBasicInfoQuery } from "@root/src/services/employee";
import {
  BusinessUnitState,
  CompanyState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@root/src/slices/organizationSlice/organizationStructure";
import { NodeType } from "@root/src/utils/types";
import { convertDataTypeToLabel } from "@root/src/utils/utils";
import {
  BusinessUnit as RawBusinessUnit,
  SubTeam as RawSubTeam,
  Team as RawTeam,
  Unit as RawUnit,
} from "@slices/organizationSlice/organization";
import BackdropProgress from "@src/component/ui/BackdropProgress";

import { useOrgAddActions } from "../hooks/useOrgAddActions";
import EmployeeOption from "./EmployeeOption";
import { SectionHeader } from "./edit-modal/SectionHeader";

type OrgOption =
  | (Partial<BusinessUnitState> & { inputValue?: string; canAdd?: boolean })
  | (Partial<TeamState> & { inputValue?: string; canAdd?: boolean })
  | (Partial<SubTeamState> & { inputValue?: string; canAdd?: boolean })
  | (Partial<UnitState> & { inputValue?: string; canAdd?: boolean });

type OrgOptionTest =
  | (RawBusinessUnit & { inputValue?: string; canAdd?: boolean })
  | (RawTeam & { inputValue?: string; canAdd?: boolean })
  | (RawSubTeam & { inputValue?: string; canAdd?: boolean })
  | (RawUnit & { inputValue?: string; canAdd?: boolean });

const filter = createFilterOptions<OrgOption>();

type ParentNode = CompanyState | BusinessUnitState | TeamState | SubTeamState;
type MappableParentNode = BusinessUnitState | TeamState | SubTeamState;

interface AddPageProps {
  open: boolean;
  orgInfo: OrgOptionTest[];
  nodeType: NodeType;
  isParentLoading: boolean;
  selectedNode: CompanyState | BusinessUnitState | TeamState | SubTeamState | UnitState;
  onClose: () => void;
}

interface AddOrgItemFormValues {
  orgNode: OrgOption | null;
  orgNodeHead: EmployeeBasicInfo | null;
  functionalLead: EmployeeBasicInfo | null;
}

export default function AddPage(props: AddPageProps) {
  const { open, orgInfo, selectedNode, nodeType, isParentLoading, onClose } = props;

  const [isNewItem, setIsNewItem] = useState<boolean>(false);

  const { data: employees = [], isLoading } = useGetEmployeesBasicInfoQuery();

  const { isAdding, createNewMapping, createNewOrgItem } = useOrgAddActions({ nodeType });

  const showSpinner = useMinimumLoadingVisibility(isAdding, SPLIT_VIEW_SKELETON_DELAY_MS);
  const showBackdrop = isAdding || isLoading || isParentLoading;

  const theme = useTheme();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddOrgItemFormValues>({
    defaultValues: {
      orgNode: null,
      orgNodeHead: null,
      functionalLead: null,
    },
  });

  const selectedOrgNode = watch("orgNode");

  const isValidParentForNodeType = (
    node: CompanyState | BusinessUnitState | TeamState | SubTeamState | UnitState,
  ): node is ParentNode => {
    switch (nodeType) {
      case NodeType.BusinessUnit:
        return node.type === NodeType.Company;
      case NodeType.Team:
        return node.type === NodeType.BusinessUnit;
      case NodeType.SubTeam:
        return node.type === NodeType.Team;
      case NodeType.Unit:
        return node.type === NodeType.SubTeam;
      default:
        return false;
    }
  };

  const isMappableParentNode = (node: ParentNode): node is MappableParentNode =>
    node.type === NodeType.BusinessUnit ||
    node.type === NodeType.Team ||
    node.type === NodeType.SubTeam;

  useEffect(() => {
    if (showSpinner) return;

    reset({ orgNode: null, orgNodeHead: null, functionalLead: null });
    setIsNewItem(false);
  }, [showSpinner, reset]);

  if (!selectedNode) {
    return <ErrorHandler message="Parent node is required" />;
  }

  const onSubmit = async (data: AddOrgItemFormValues) => {
    if (!isValidParentForNodeType(selectedNode)) return;

    const parent = selectedNode;

    try {
      if (isNewItem) {
        await createNewOrgItem(data, parent);
      } else {
        if (!isMappableParentNode(parent)) return;
        await createNewMapping(data, parent);
      }
    } catch (e) {
      console.error("Add org item failed", e);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const title = `New ${convertDataTypeToLabel(nodeType)} for ${selectedNode.name} ${convertDataTypeToLabel(selectedNode.type)}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          position: "relative",
          width: "700px",
          maxHeight: "600px",
          borderRadius: 1.5,
          boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.1)",
          backgroundColor: theme.palette.fill.secondary.light.active,
          backgroundImage: "none",
          padding: "4px",
        },
      }}
    >
      <BackdropProgress
        open={showBackdrop}
        sx={{
          position: "absolute",
          zIndex: (theme) => theme.zIndex.modal + 1,
          borderRadius: "8px",
        }}
      />

      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px",
          paddingX: "12px",
          paddingY: "4px",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.customText.secondary.p1.active,
            fontWeight: 600,
          }}
        >
          Create a new {convertDataTypeToLabel(nodeType)}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.customText.secondary.p1.active,
            p: 0,
          }}
        >
          <CloseIcon sx={{ fontSize: "20px" }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          borderRadius: "12px",
          border: `1px solid ${theme.palette.customBorder.primary.b2.active}`,
          backgroundColor: theme.palette.surface.secondary.active,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          color: theme.palette.customText.primary.p2.active,
          padding: "16px !important",
        }}
      >
        <SectionHeader title={title} />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.customText.primary.p3.active,
                fontWeight: 500,
              }}
            >
              {convertDataTypeToLabel(nodeType)}
            </Typography>

            <Controller
              name="orgNode"
              control={control}
              rules={{
                required: `${convertDataTypeToLabel(nodeType)} is required`,
              }}
              render={({ field }) =>
                nodeType === NodeType.BusinessUnit ? (
                  <TextField
                    {...field}
                    value={field.value?.name ?? ""}
                    onChange={(e) => {
                      setIsNewItem(true);
                      field.onChange({ name: e.target.value } as OrgOption);
                    }}
                    placeholder={`Enter ${convertDataTypeToLabel(nodeType).toLowerCase()} name`}
                    disabled={showSpinner}
                    error={!!errors.orgNode}
                    helperText={errors.orgNode?.message}
                  />
                ) : (
                  <Autocomplete<OrgOption>
                    {...field}
                    value={field.value}
                    options={orgInfo as OrgOption[]}
                    loading={isLoading}
                    disabled={showSpinner}
                    getOptionDisabled={(option) => option.canAdd === false}
                    getOptionLabel={(option) => option.name ?? ""}
                    filterOptions={(options, params) => {
                      const filtered = filter(options as OrgOption[], params);
                      const { inputValue } = params;

                      const isExisting = options.some(
                        (option) => inputValue.toLowerCase() === (option.name ?? "").toLowerCase(),
                      );

                      setIsNewItem(inputValue !== "" && !isExisting);

                      if (inputValue !== "" && !isExisting) {
                        filtered.push({
                          name: inputValue,
                          inputValue,
                        });
                      }

                      return filtered;
                    }}
                    onChange={(_, data) => {
                      if (data && "inputValue" in data && data.inputValue) {
                        field.onChange(data as OrgOption);
                      } else if (data && data.name) {
                        field.onChange(data as OrgOption);
                      } else {
                        field.onChange(data as OrgOption);
                      }
                    }}
                    renderOption={(props, option) => {
                      const isCreate = option.inputValue !== undefined;
                      return (
                        <li {...props}>
                          <Typography
                            sx={{
                              color: isCreate
                                ? theme.palette.customText.secondary.p2.active
                                : theme.palette.customText.primary.p2.active,
                            }}
                          >
                            {isCreate ? `Add "${option.inputValue}"` : option.name}
                          </Typography>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={`Select or create a ${convertDataTypeToLabel(nodeType).toLowerCase()}`}
                        error={!!errors.orgNode}
                        helperText={errors.orgNode?.message}
                        sx={{
                          "& .MuiInputBase-root": {
                            p: "4px !important",
                          },
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoading && <CircularProgress size={14} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )
              }
            />
          </Box>

          {(nodeType === NodeType.BusinessUnit || (selectedOrgNode && isNewItem)) && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.customText.primary.p3.active,
                  fontWeight: 500,
                }}
              >
                {convertDataTypeToLabel(nodeType)} Head
              </Typography>

              <Controller
                name="orgNodeHead"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    value={field.value}
                    onChange={(_, data) => field.onChange(data)}
                    options={employees}
                    loading={isLoading}
                    disabled={showSpinner}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                    renderOption={(props, employee) => (
                      <EmployeeOption
                        key={employee.employeeId}
                        listItemProps={props}
                        employee={employee}
                      />
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={`Select a ${convertDataTypeToLabel(nodeType).toLowerCase()} head`}
                        error={!!errors.orgNodeHead}
                        helperText={errors.orgNodeHead?.message}
                        sx={{
                          "& .MuiInputBase-root": {
                            p: "4px !important",
                          },
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoading && <CircularProgress size={14} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
            </Box>
          )}

          {nodeType !== NodeType.BusinessUnit && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.customText.primary.p3.active,
                  fontWeight: 500,
                }}
              >
                {convertDataTypeToLabel(nodeType)} functional lead
              </Typography>

              <Controller
                name="functionalLead"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    value={field.value}
                    onChange={(_, data) => field.onChange(data)}
                    options={employees}
                    loading={isLoading}
                    disabled={showSpinner}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                    renderOption={(props, employee) => (
                      <EmployeeOption
                        key={employee.employeeId}
                        listItemProps={props}
                        employee={employee}
                      />
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select a functional lead"
                        error={!!errors.functionalLead}
                        helperText={errors.functionalLead?.message}
                        sx={{
                          "& .MuiInputBase-root": {
                            p: "4px !important",
                          },
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoading && <CircularProgress size={14} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button type="button" variant="outlined" size="small" onClick={handleCancel}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant={"primary" as any}
              size="small"
              startIcon={
                showSpinner ? (
                  <CircularProgress size={14} thickness={5} color="inherit" />
                ) : undefined
              }
            >
              Add {convertDataTypeToLabel(nodeType)}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
