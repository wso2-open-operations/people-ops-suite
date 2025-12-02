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

import { mockEmailContacts } from "./component/mockEmailData";

export default function NotifyPeople() {
  const theme = useTheme();
  
  return (
    <Stack gap="1rem">
      <Typography variant="h5">Select people/groups to notify (via email)</Typography>
      <Autocomplete
        multiple
        options={mockEmailContacts.map((contact) => contact.email)}
        renderInput={(params) => <TextField {...params} label="Select emails" />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={index}
              label={option}
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 30, height: 30 }}>
                  <Email sx={{ fontSize: 12, color: theme.palette.common.white }} />
                </Avatar>
              }
            />
          ))
        }
        sx={{
          "& .MuiChip-root": {
            backgroundColor: theme.palette.common.white,
            color: theme.palette.primary.main,
            fontWeight: 500,
            borderRadius: "6px",
            border: `1px solid ${theme.palette.primary.main}`,
          },
          "& .MuiChip-root:hover": {
            backgroundColor: theme.palette.common.white,
          },
          "& .MuiChip-deleteIcon": {
            color: theme.palette.primary.main,
          },
          "& .MuiChip-deleteIcon:hover": {
            color: theme.palette.primary.main,
          },
        }}
      />
    </Stack>
  );
}
