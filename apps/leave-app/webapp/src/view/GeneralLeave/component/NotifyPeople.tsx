// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import { Email } from "@mui/icons-material";
import { Autocomplete, Avatar, Chip, CircularProgress, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchEmployees } from "@root/src/services/leaveService";
import { Employee } from "@root/src/types/types";

interface EmployeeOption {
  label: string;
  email: string;
  thumbnail: string | null;
}

export default function NotifyPeople() {
  const theme = useTheme();
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const employees = await fetchEmployees();
        const options = employees.map((employee: Employee) => ({
          label: `${employee.firstName} ${employee.lastName} (${employee.workEmail})`,
          email: employee.workEmail,
          thumbnail: employee.employeeThumbnail,
        }));
        setEmployeeOptions(options);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        setEmployeeOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  return (
    <Stack gap="1rem">
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
        Select people/groups to notify (via email)
      </Typography>
      <Autocomplete
        multiple
        options={employeeOptions}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.email === value.email}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select emails"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={index}
              label={option.email}
              avatar={
                option.thumbnail ? (
                  <Avatar
                    src={option.thumbnail}
                    sx={{ width: 30, height: 30 }}
                  />
                ) : (
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 30, height: 30 }}>
                    <Email
                      sx={{
                        fontSize: theme.typography.caption.fontSize,
                        color: theme.palette.primary.contrastText,
                      }}
                    />
                  </Avatar>
                )
              }
            />
          ))
        }
        sx={{
          "& .MuiChip-root": {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.primary.main,
            fontWeight: 500,
            borderRadius: "6px",
            border: `1px solid ${theme.palette.primary.main}`,
          },
          "& .MuiChip-root:hover": {
            backgroundColor: theme.palette.action.hover,
          },
          "& .MuiChip-deleteIcon": {
            color: theme.palette.primary.main,
          },
          "& .MuiChip-deleteIcon:hover": {
            color: theme.palette.primary.dark,
          },
        }}
      />
    </Stack>
  );
}
