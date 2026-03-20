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

import BackdropProgress from "@root/src/component/ui/BackdropProgress";
import { EmployeeBasicInfo, useGetEmployeesBasicInfoQuery } from "@root/src/services/employee";
import {
  BusinessUnitState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@root/src/slices/organizationSlice/organizationStructure";
import { NodeType } from "@root/src/utils/types";
import {
  OrgNodePayload,
  useAddBusinessUnitsMutation,
  useAddSubTeamsMutation,
  useAddTeamsMutation,
  useAddUnitsMutation,
} from "@services/organization";

import { SectionHeader } from "../../components/edit-modal/SectionHeader";
import EmployeeOption from "./EmployeeOption";

type OrgOption =
  | (Partial<BusinessUnitState> & { inputValue?: string })
  | (Partial<TeamState> & { inputValue?: string })
  | (Partial<SubTeamState> & { inputValue?: string })
  | (Partial<UnitState> & { inputValue?: string });

const filter = createFilterOptions<OrgOption>();
interface AddPageProps {
  open: boolean;
  orgInfo: OrgOption[] | null;
  nodeType: NodeType | null;
  parentId: string | null;
  onClose: () => void;
}

interface AddOrgItemFormValues {
  team: OrgOption | null;
  teamHead: EmployeeBasicInfo | null;
  functionalLead: EmployeeBasicInfo | null;
}

interface AddOrgItemPayload {
  team: OrgOption;
  teamHead: EmployeeBasicInfo;
  functionalLead: EmployeeBasicInfo | null;
}

export default function AddPage(props: AddPageProps) {
  const { open, orgInfo, nodeType, parentId, onClose } = props;

  const { data: employees = [], isLoading } = useGetEmployeesBasicInfoQuery();
  const [addBusinessUnits] = useAddBusinessUnitsMutation();
  const [addTeams] = useAddTeamsMutation();
  const [addSubTeams] = useAddSubTeamsMutation();
  const [addUnits] = useAddUnitsMutation();

  const theme = useTheme();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddOrgItemFormValues>({
    defaultValues: {
      team: null,
      teamHead: null,
      functionalLead: null,
    },
  });

  const selectedTeam = watch("team");

  const onSubmit = async (data: AddOrgItemFormValues) => {
    const { team, teamHead, functionalLead } = data as AddOrgItemPayload;

    if (!team || !team.name || !teamHead || !parentId) {
      console.error("Team and team head are required");
      return;
    }

    const apiPayload: OrgNodePayload = {
      name: team.name,
      headEmail: teamHead.workEmail,
      ...(functionalLead && {
        orgNodeLinkInfo: {
          id: parentId,
          functionalLeadEmail: functionalLead.workEmail,
        },
      }),
    };

    try {
      // Route API call based on nodeType
      switch (nodeType) {
        case NodeType.BusinessUnit:
          await addBusinessUnits(apiPayload).unwrap();
          break;
        case NodeType.Team:
          if (!parentId) {
            console.error("Parent Business Unit ID is required");
            return;
          }
          await addTeams({ buId: parentId, payload: apiPayload }).unwrap();
          break;
        case NodeType.SubTeam:
          if (!parentId) {
            console.error("Parent Team ID is required");
            return;
          }
          await addSubTeams({ teamId: parentId, payload: apiPayload }).unwrap();
          break;
        case NodeType.Unit:
          if (!parentId) {
            console.error("Parent Sub Team ID is required");
            return;
          }
          await addUnits({ subTeamId: parentId, payload: apiPayload }).unwrap();
          break;
        default:
          console.error("Invalid node type");
          return;
      }

      reset();
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  if (!orgInfo) return;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            position: "relative",
            width: "700px",
            maxHeight: "600px",
            borderRadius: "8px",
            boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme.palette.fill.secondary.light.active,
            padding: "4px",
          },
        },
      }}
    >
      <BackdropProgress
        open={isLoading}
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
          Add Page
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.customText.primary.p2.active,
            p: 0,
          }}
        >
          <CloseIcon />
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
        <SectionHeader title="Add Teams" />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            name="team"
            control={control}
            rules={{ required: "Team is required " }}
            render={({ field }) => (
              <Autocomplete<OrgOption>
                {...field}
                value={field.value}
                options={orgInfo as OrgOption[]}
                loading={isLoading}
                getOptionLabel={(option) => option.name ?? ""}
                filterOptions={(options, params) => {
                  const filtered = filter(options as OrgOption[], params);
                  const { inputValue } = params;

                  // Check if the input matches any existing option
                  const isExisting = options.some(
                    (option) => inputValue.toLowerCase() === (option.name ?? "").toLowerCase(),
                  );

                  // If user typed something and it doesn't exist, add "Create" option
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
                    placeholder="Select or create a team"
                    error={!!errors.team}
                    helperText={errors.team?.message}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        sx: { padding: "4px !important" },
                        endAdornment: (
                          <>
                            {isLoading && <CircularProgress size={14} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            )}
          />

          <Controller
            name="teamHead"
            control={control}
            rules={{ required: "Team head is required" }}
            render={({ field }) => (
              <Autocomplete
                {...field}
                value={field.value}
                onChange={(_, data) => field.onChange(data)}
                options={employees}
                loading={isLoading}
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
                    placeholder="Select a team head"
                    error={!!errors.teamHead}
                    helperText={errors.teamHead?.message}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        sx: { padding: "4px !important" },
                        endAdornment: (
                          <>
                            {isLoading && <CircularProgress size={14} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            )}
          />

          {nodeType !== NodeType.BusinessUnit && selectedTeam && selectedTeam.inputValue && (
            <Controller
              name="functionalLead"
              control={control}
              rules={{ required: "Functional lead is required " }}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  value={field.value}
                  onChange={(_, data) => field.onChange(data)}
                  options={employees}
                  loading={isLoading}
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
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          sx: { padding: "4px !important" },
                          endAdornment: (
                            <>
                              {isLoading && <CircularProgress size={14} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              )}
            />
          )}

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button type="button" variant="outlined" size="small" onClick={handleCancel}>
              Cancel
            </Button>

            <Button type="submit" variant={"primary" as any} size="small">
              Add Team
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
