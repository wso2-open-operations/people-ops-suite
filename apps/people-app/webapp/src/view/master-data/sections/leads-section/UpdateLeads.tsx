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
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import { useEffect, useState } from "react";

import ConfirmationDialog from "@component/common/ConfirmationDialog";
import { SPLIT_VIEW_SKELETON_DELAY_MS } from "@config/constant";
import { useMinimumLoadingVisibility } from "@root/src/hooks/useMinimumLoadingVisibility";
import { EmployeeBasicInfo, useGetEmployeesBasicInfoQuery } from "@services/employee";
import { Head } from "@services/organization";
import { NodeType } from "@utils/types";
import { capitalizeWords, convertDataTypeToLabel, truncateName } from "@utils/utils";

const NAME_TRUNCATE_LENGTH = 16;
const DESIGNATION_TRUNCATE_LENGTH = 30;

type LeadPanelType = "head" | "functionalLead";

interface PendingSwap {
  panel: LeadPanelType;
  employee: EmployeeBasicInfo;
}

interface EmployeeOptionProps {
  listItemProps: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
  employee: EmployeeBasicInfo;
}

const EmployeeOption: React.FC<EmployeeOptionProps> = ({ listItemProps, employee }) => {
  const theme = useTheme();
  const label = employee.designation ?? employee.workEmail;
  const { key: optionKey, ...itemProps } = listItemProps;

  return (
    <Box
      key={optionKey}
      component="li"
      {...itemProps}
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        py: "10px !important",
        px: "12px !important",
      }}
    >
      <Avatar
        src={employee.employeeThumbnail ?? undefined}
        sx={{
          borderRadius: "8px",
          fontSize: 12,
          height: "40px",
          width: "40px",
        }}
      >
        {employee.firstName.charAt(0)}
      </Avatar>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p2.active }}>
          {employee.firstName} {employee.lastName}
        </Typography>

        <Typography variant="caption" sx={{ color: theme.palette.customText.primary.p4.active }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

const EmployeePreview: React.FC<{ employee: EmployeeBasicInfo }> = ({ employee }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        p: 1,
        borderRadius: "6px",
        backgroundColor: theme.palette.surface.secondary.active,
        border: `1px solid ${theme.palette.customBorder.primary.b2.active}`,
      }}
    >
      <Avatar
        src={employee.employeeThumbnail ?? undefined}
        sx={{ width: 36, height: 36, borderRadius: "8px" }}
      >
        {employee.firstName.charAt(0)}
      </Avatar>

      <Box>
        <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p2.active }}>
          {employee.firstName} {employee.lastName}
        </Typography>

        <Typography variant="caption" sx={{ color: theme.palette.customText.primary.p4.active }}>
          {employee.designation ?? employee.workEmail}
        </Typography>
      </Box>
    </Box>
  );
};

interface SelectLeadPanelProps {
  onRequestConfirm: (employee: EmployeeBasicInfo) => void;
  isAddMode?: boolean;
}

const SelectLeadPanel: React.FC<SelectLeadPanelProps> = ({ onRequestConfirm, isAddMode }) => {
  const [selected, setSelected] = useState<EmployeeBasicInfo | null>(null);
  const { data: employees = [], isLoading } = useGetEmployeesBasicInfoQuery();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        borderRadius: "6px",
        minWidth: "500px",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 0.9 }}>
        <Autocomplete
          options={employees}
          loading={isLoading}
          value={selected}
          onChange={(_, val) => setSelected(val)}
          getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
          isOptionEqualToValue={(a, b) => a.employeeId === b.employeeId}
          slotProps={{ paper: { sx: { mt: 0.5 } } }}
          renderOption={(props, employee) => (
            <EmployeeOption key={employee.employeeId} listItemProps={props} employee={employee} />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={isAddMode ? "Search employee to add..." : "Search employee..."}
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
        {selected && <EmployeePreview employee={selected} />}
      </Box>

      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <Button
          size="small"
          variant="outlined"
          disabled={!selected}
          onClick={() => selected && onRequestConfirm(selected)}
        >
          {isAddMode ? "Add" : "Confirm"}
        </Button>
      </Box>
    </Box>
  );
};

interface AddLeadPanelProps {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRequestConfirm: (employee: EmployeeBasicInfo) => void;
}

const AddLeadPanel: React.FC<AddLeadPanelProps> = ({
  label,
  isExpanded,
  onToggle,
  onRequestConfirm,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "fit-content",
        minWidth: "300px",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          minWidth: "200px",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.customText.primary.p3.active,
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>

        <Box
          onClick={onToggle}
          sx={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            p: 1,
            borderRadius: "6px",
            border: `1px dashed ${theme.palette.customBorder.primary.b2.active}`,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: theme.palette.fill.neutral.light.hover,
            },
          }}
        >
          <Avatar sx={{ width: 40, height: 40, borderRadius: "8px" }}>
            <AddIcon sx={{ width: 20, height: 20 }} />
          </Avatar>
          <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p3.active }}>
            Click to add
          </Typography>
        </Box>
      </Box>
      {isExpanded && <SelectLeadPanel onRequestConfirm={onRequestConfirm} isAddMode />}
    </Box>
  );
};

interface LeadRowProps {
  label: string;
  lead: Head;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const LeadRow: React.FC<LeadRowProps> = ({ label, lead, isExpanded, onToggle, title }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "350px",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.customText.primary.p3.active,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>

      <Box sx={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {/* Lead identity */}
        <Box sx={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
          <Avatar src={lead.avatar} sx={{ width: 40, height: 40, borderRadius: "8px" }}>
            {lead.name.charAt(0)}
          </Avatar>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.customText.primary.p2.active,
                textTransform: "capitalize",
              }}
            >
              {truncateName(lead.name, NAME_TRUNCATE_LENGTH)}
            </Typography>

            <Tooltip title={title}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.customText.primary.p4.active,
                  textTransform: "capitalize",
                  fontWeight: 400,
                }}
              >
                {truncateName(title, DESIGNATION_TRUNCATE_LENGTH)}
              </Typography>
            </Tooltip>
          </Box>
        </Box>

        {/* Toggle swap panel */}
        <IconButton
          onClick={onToggle}
          sx={{
            ml: 2,
            height: 37,
            width: 37,
            border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            borderRadius: "6px",
            padding: "6px 12px",
            "&:hover": {
              backgroundColor: theme.palette.fill.neutral.light.hover,
              border: `1px solid ${theme.palette.customBorder.primary.b3.hover}`,
            },
          }}
        >
          {isExpanded ? (
            <CloseIcon
              sx={{
                width: 16,
                height: 16,
                color: theme.palette.customText.primary.p2.active,
              }}
            />
          ) : (
            <SwapHorizIcon
              sx={{
                width: 16,
                height: 16,
                color: theme.palette.customText.primary.p2.active,
              }}
            />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

interface UpdatableLeadProps {
  label: string;
  title: string;
  lead: Head;
  isExpanded: boolean;
  onToggle: () => void;
  onRequestConfirm: (employee: EmployeeBasicInfo) => void;
}

const UpdatableLead: React.FC<UpdatableLeadProps> = ({
  label,
  lead,
  title,
  isExpanded,
  onToggle,
  onRequestConfirm,
}) => (
  <Box
    sx={{
      width: "fit-content",
      minWidth: "300px",
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
    }}
  >
    <LeadRow label={label} lead={lead} title={title} isExpanded={isExpanded} onToggle={onToggle} />
    {isExpanded && <SelectLeadPanel onRequestConfirm={onRequestConfirm} />}
  </Box>
);

export interface UpdateLeadsProps {
  head: Head | null;
  functionalLead?: Head | null;
  isUpdating: boolean;
  nodeType: NodeType;
  onSwapHead: (employee: EmployeeBasicInfo, reason: string) => Promise<void>;
  onSwapFunctionalLead: (employee: EmployeeBasicInfo, reason: string) => Promise<void>;
}

export const UpdateLeads: React.FC<UpdateLeadsProps> = ({
  head,
  functionalLead,
  onSwapHead,
  onSwapFunctionalLead,
  isUpdating,
  nodeType,
}) => {
  const [activePanel, setActivePanel] = useState<LeadPanelType | null>(null);
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);
  const [pendingCloseAfterSpinner, setPendingCloseAfterSpinner] = useState(false);

  const showSpinner = useMinimumLoadingVisibility(isUpdating, SPLIT_VIEW_SKELETON_DELAY_MS);

  const dialogSubmitting = pendingCloseAfterSpinner && showSpinner;

  const handleRequestConfirm = (panel: LeadPanelType) => (employee: EmployeeBasicInfo) => {
    setPendingSwap({ panel, employee });
  };

  const handleConfirm = async (_reason: string) => {
    if (!pendingSwap) return;
    const { panel, employee } = pendingSwap;

    try {
      if (panel === "head") {
        await onSwapHead(employee, _reason);
      } else {
        await onSwapFunctionalLead(employee, _reason);
      }
      setPendingCloseAfterSpinner(true);
    } catch (e) {
      console.error("Swap lead failed", e);
    }
  };

  const handleCancel = () => setPendingSwap(null);

  useEffect(() => {
    if (!pendingCloseAfterSpinner || showSpinner) return;
    setPendingSwap(null);
    setActivePanel(null);
    setPendingCloseAfterSpinner(false);
  }, [pendingCloseAfterSpinner, showSpinner]);

  const togglePanel = (panel: LeadPanelType) =>
    setActivePanel((current) => (current === panel ? null : panel));

  return (
    <>
      <ConfirmationDialog
        open={pendingSwap !== null}
        title={pendingSwap?.panel === "head" ? "Add Head" : "Add Functional Lead"}
        message={
          pendingSwap?.panel === "head"
            ? "This action will set the head for this organization unit. Are you sure?"
            : "This action will set the functional lead for this organization unit. Are you sure?"
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isSubmitting={dialogSubmitting}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          px: 0.5,
          gap: 2,
        }}
      >
        {head ? (
          <UpdatableLead
            label={`${convertDataTypeToLabel(nodeType)} Head`}
            lead={head}
            title={`${capitalizeWords(head.title)} Head`}
            isExpanded={activePanel === "head"}
            onToggle={() => togglePanel("head")}
            onRequestConfirm={handleRequestConfirm("head")}
          />
        ) : (
          <AddLeadPanel
            label={`${convertDataTypeToLabel(nodeType)} Head`}
            isExpanded={activePanel === "head"}
            onToggle={() => togglePanel("head")}
            onRequestConfirm={handleRequestConfirm("head")}
          />
        )}

        {nodeType !== NodeType.BusinessUnit &&
          (functionalLead ? (
            <UpdatableLead
              label={`${convertDataTypeToLabel(nodeType)} Functional Lead`}
              title={`${capitalizeWords(functionalLead.title)} Functional Lead`}
              lead={functionalLead}
              isExpanded={activePanel === "functionalLead"}
              onToggle={() => togglePanel("functionalLead")}
              onRequestConfirm={handleRequestConfirm("functionalLead")}
            />
          ) : (
            <AddLeadPanel
              label={`${convertDataTypeToLabel(nodeType)} Functional Lead`}
              isExpanded={activePanel === "functionalLead"}
              onToggle={() => togglePanel("functionalLead")}
              onRequestConfirm={handleRequestConfirm("functionalLead")}
            />
          ))}
      </Box>
    </>
  );
};
