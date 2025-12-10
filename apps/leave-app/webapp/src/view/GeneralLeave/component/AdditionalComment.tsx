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

import { FormControlLabel, Stack, Switch, TextField, Typography, useTheme } from "@mui/material";

import { useState } from "react";

import CustomButton from "@root/src/component/common/CustomButton";

export default function AdditionalComment() {
  const theme = useTheme();
  const [isPublicComment, setIsPublicComment] = useState(false);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPublicComment(event.target.checked);
  };

  return (
    <Stack gap="1rem">
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
        Additional Comments
      </Typography>
      <TextField label="Add a comment..." multiline minRows={3} fullWidth variant="outlined" />

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "center" }}
        width="100%"
        gap="0.5rem"
      >
        <Stack direction="row" gap="0.5rem" alignItems="center">
          <FormControlLabel
            control={<Switch onChange={handleCheckboxChange} />}
            label="Public comment"
            sx={{ color: theme.palette.text.secondary }}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} alignItems="center" gap="1rem">
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
            textAlign="center"
          >
            {isPublicComment
              ? "Your comment will be shown to all email recipients including WSO2 Vacation Group (vacation-group@leaveapp.com)."
              : "Your comment will only be shown to your lead and any emails that have been added."}
          </Typography>
          <CustomButton label="Submit" />
        </Stack>
      </Stack>
    </Stack>
  );
}
