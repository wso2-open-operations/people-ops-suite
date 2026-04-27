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
import { Avatar, Box, Typography, useTheme } from "@mui/material";

import { EmployeeBasicInfo } from "@services/employee";

interface EmployeeOptionProps {
  listItemProps: React.HTMLAttributes<HTMLLIElement>;
  employee: EmployeeBasicInfo;
}

export default function EmployeeOption({ listItemProps, employee }: EmployeeOptionProps) {
  const theme = useTheme();
  const label = employee.designation ?? employee.workEmail;

  return (
    <Box
      component="li"
      {...listItemProps}
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
        sx={{ borderRadius: "8px", fontSize: 12, height: "40px", width: "40px" }}
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
}
