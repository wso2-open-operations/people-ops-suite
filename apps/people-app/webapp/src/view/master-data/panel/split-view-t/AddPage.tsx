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
import {
  Autocomplete,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import BackdropProgress from "@root/src/component/ui/BackdropProgress";
import { useGetEmployeesBasicInfoQuery } from "@root/src/services/employee";

import { SectionHeader } from "../../components/edit-modal/SectionHeader";
import EmployeeOption from "./EmployeeOption";

interface AddPageProps {
  open: boolean;
  onClose: () => void;
}

export default function AddPage(props: AddPageProps) {
  const { open, onClose } = props;
  const { data: employees = [], isLoading } = useGetEmployeesBasicInfoQuery();
  const theme = useTheme();

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
      {/*<BackdropProgress
          open={isLoading}
          sx={{
            position: "absolute",
            zIndex: (theme) => theme.zIndex.modal + 1,
            borderRadius: "8px",
          }}
        /> */}

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
        />
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

        <Autocomplete
          options={employees}
          loading={isLoading}
          renderInput={(params) => <TextField {...params} />}
          renderOption={(props, employee) => (
            <EmployeeOption key={employee.employeeId} listItemProps={props} employee={employee} />
          )}
        />
      </DialogContent>
    </Dialog>
  );
}
