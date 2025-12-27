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
import {
  Autocomplete,
  Avatar,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import { useEffect, useState } from "react";

import { fetchEmployees, getDefaultMails } from "@root/src/services/leaveService";
import { DefaultMail, DefaultMailResponse, Employee } from "@root/src/types/types";

interface EmployeeOption {
  label: string;
  email: string;
  thumbnail: string | null;
  isFixed?: boolean;
}

interface NotifyPeopleProps {
  selectedEmails: string[];
  onEmailsChange: (emails: string[]) => void;
}

export default function NotifyPeople({ selectedEmails, onEmailsChange }: NotifyPeopleProps) {
  const theme = useTheme();
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixedEmails, setFixedEmails] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const employees = await fetchEmployees();
        const defaultMails: DefaultMailResponse = await getDefaultMails();
        const mandatoryMails = defaultMails.mandatoryMails;
        const optionalMails = defaultMails.optionalMails;

        const fixedEmailList = mandatoryMails.map((mail: DefaultMail) => mail.email);
        setFixedEmails(fixedEmailList);

        const employeeOptions = employees.map((employee: Employee) => ({
          label: `${employee.firstName} ${employee.lastName} (${employee.workEmail})`,
          email: employee.workEmail,
          thumbnail: employee.employeeThumbnail,
          isFixed: fixedEmailList.includes(employee.workEmail),
        }));

        // Add mandatory mails that are not in employee list
        const missingMandatoryOptions = mandatoryMails
          .filter((mail: DefaultMail) => !employeeOptions.find((opt) => opt.email === mail.email))
          .map((mail: DefaultMail) => ({
            label: mail.email,
            email: mail.email,
            thumbnail: mail.thumbnail || null,
            isFixed: true,
          }));

        // Add optional mails that are not in employee list
        const missingOptionalOptions = optionalMails
          .filter(
            (mail: DefaultMail) =>
              !employeeOptions.find((opt) => opt.email === mail.email) &&
              !missingMandatoryOptions.find((opt) => opt.email === mail.email),
          )
          .map((mail: DefaultMail) => ({
            label: mail.email,
            email: mail.email,
            thumbnail: mail.thumbnail || null,
            isFixed: false,
          }));

        setEmployeeOptions([
          ...employeeOptions,
          ...missingMandatoryOptions,
          ...missingOptionalOptions,
        ]);

        const optionalEmailList = optionalMails.map((mail: DefaultMail) => mail.email);
        onEmailsChange([...fixedEmailList, ...optionalEmailList]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setEmployeeOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
        Select people/groups to notify (via email)
      </Typography>
      <Autocomplete
        multiple
        options={employeeOptions}
        value={selectedOptions}
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
