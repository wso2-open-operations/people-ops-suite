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
import { Autocomplete, Avatar, Chip, Stack, TextField, Typography, useTheme } from "@mui/material";

import { useEffect, useState } from "react";

import { selectEmployeeState, selectEmployees } from "@root/src/slices/employeeSlice/employee";
import { useAppSelector } from "@root/src/slices/store";
import { selectUser } from "@root/src/slices/userSlice/user";
import { CachedMail, State } from "@root/src/types/types";

interface EmployeeOption {
  label: string;
  email: string;
  thumbnail: string | null;
  isFixed?: boolean;
}

interface NotifyPeopleProps {
  selectedEmails: string[];
  onEmailsChange: (emails: string[]) => void;
  onMandatoryEmailsChange: (emails: string[]) => void;
}

export default function NotifyPeople({
  selectedEmails,
  onEmailsChange,
  onMandatoryEmailsChange,
}: NotifyPeopleProps) {
  const theme = useTheme();
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [fixedEmails, setFixedEmails] = useState<string[]>([]);

  const employeeState = useAppSelector(selectEmployeeState);
  const employees = useAppSelector(selectEmployees);
  const loading = employeeState === State.loading;

  const defaultMails: CachedMail = useAppSelector(selectUser)?.cachedEmails || {
    mandatoryMails: [],
    optionalMails: [],
  };

  useEffect(() => {
    const mandatoryOptions = defaultMails.mandatoryMails.map((mail) => ({
      label: mail.email,
      email: mail.email,
      thumbnail: mail.thumbnail || null,
      isFixed: true,
    }));

    const optionalOptions = defaultMails.optionalMails
      .filter((mail) => !defaultMails.mandatoryMails.find((m) => m.email === mail.email))
      .map((mail) => ({
        label: mail.email,
        email: mail.email,
        thumbnail: mail.thumbnail || null,
        isFixed: false,
      }));

    const fixedEmailList = mandatoryOptions.map((m) => m.email);

    setFixedEmails(fixedEmailList);
    onMandatoryEmailsChange(fixedEmailList);
    onEmailsChange([...fixedEmailList, ...optionalOptions.map((o) => o.email)]);

    setEmployeeOptions([...mandatoryOptions, ...optionalOptions]);
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      const employeeOptionsFromApi = employees.map((employee) => ({
        label: `${employee.firstName} ${employee.lastName} (${employee.workEmail})`,
        email: employee.workEmail,
        thumbnail: employee.employeeThumbnail,
        isFixed: fixedEmails.includes(employee.workEmail),
      }));

      setEmployeeOptions((prev) => {
        const existingEmails = new Set(prev.map((o) => o.email));

        return [...prev, ...employeeOptionsFromApi.filter((opt) => !existingEmails.has(opt.email))];
      });
    }
  }, [employees, fixedEmails]);

  const selectedOptions = employeeOptions
    .filter((opt) => opt.isFixed || selectedEmails.includes(opt.email))
    .sort((a, b) => {
      // Add mandatory mails first, then optional mails
      if (a.isFixed && !b.isFixed) return -1;
      if (!a.isFixed && b.isFixed) return 1;
      return 0;
    });

  return (
    <Stack gap="1rem">
      <Stack flexDirection="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          Select people/groups to notify (via email)
        </Typography>
      </Stack>
      <Autocomplete
        multiple
        options={employeeOptions}
        value={selectedOptions}
        loading={loading}
        loadingText="Loading employees..."
        noOptionsText="No employees found"
        onChange={(_, newValue) => {
          // Keep fixed options in value
          const newEmails = [
            ...fixedEmails,
            ...newValue.filter((opt) => !opt.isFixed).map((opt) => opt.email),
          ];
          onEmailsChange(newEmails);
        }}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.email === value.email}
        renderInput={(params) => <TextField {...params} label="Select emails" />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const ChipAvatar = option.thumbnail ? (
              <Avatar
                src={option.thumbnail}
                alt={option.email}
                imgProps={{
                  onError: (e: any) => {
                    e.target.style.display = "none";
                  },
                }}
                sx={{ width: 30, height: 30 }}
              >
                {!option.thumbnail && (
                  <Email
                    sx={{
                      fontSize: theme.typography.caption.fontSize,
                      color: theme.palette.primary.contrastText,
                    }}
                  />
                )}
              </Avatar>
            ) : (
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 30, height: 30 }}>
                <Email
                  sx={{
                    fontSize: theme.typography.caption.fontSize,
                    color: theme.palette.primary.contrastText,
                  }}
                />
              </Avatar>
            );

            return (
              <Chip
                {...getTagProps({ index })}
                key={option.email}
                label={option.email}
                avatar={ChipAvatar}
                onDelete={option.isFixed ? undefined : getTagProps({ index }).onDelete}
                sx={{
                  ".MuiChip-root:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  ".MuiChip-deleteIcon": {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            );
          })
        }
        sx={{
          "& .MuiChip-root": {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.primary.main,
            fontWeight: 500,
            borderRadius: "6px",
            border: `1px solid ${theme.palette.primary.main}`,
          },
        }}
      />
    </Stack>
  );
}
