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

import { Box, Stack, TextField, Typography, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import CheckBox from "@root/src/component/common/CheckBox";
import CustomButton from "@root/src/component/common/CustomButton";
import { FormContainer } from "@root/src/component/common/FormContainer";
import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";

export default function ApplyTab() {
  const theme = useTheme();
  return (
    <Stack gap="1rem" flexDirection="column" maxWidth={PAGE_MAX_WIDTH} mx="auto">
      <Title firstWord="Sabbatical" secondWord="Leave Application" />
      <FormContainer>
        <Stack
          direction={{ xs: "column", md: "row" }}
          width="100%"
          gap="3rem"
          justifyContent="flex-start"
        >
          <Stack flex="1" gap="1rem">
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Employment Start Date
            </Typography>
            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              22/12/2025
            </Typography>
            <DatePicker label="Last sabbatical leave end date" />
          </Stack>

          <Stack flex="1" gap="1rem">
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Eligibility Status
            </Typography>
            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Not Eligible
            </Typography>
            <DatePicker label="Leave request start date" />
          </Stack>
          <Stack flex="1" justifyContent="space-between">
            <CheckBox label="Have you taken Sabbatical Leave before?" />
            <DatePicker label="Leave request end date" />
          </Stack>
        </Stack>

        <Stack direction={{ md: "row" }} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            Additional Comments:
          </Typography>
          <TextField label="Add a comment..." multiline minRows={2} fullWidth variant="outlined" />
        </Stack>
        <Stack gap="0.5rem">
          <CheckBox label="I confirm that I have discussed my sabbatical leave plans with my manager and have obtained their approval." />
          <CheckBox label="I have read and understood the terms of the Sabbatical Leave Policy." />
          <CheckBox label="I acknowledge that I cannot voluntarily resign from your employment for 6 months after completing sabbatical leave. If you do, you will be required to reimburse an amount equivalent to the salary paid to you during the sabbatical period." />
        </Stack>

        <Box mx={{ xs: "auto", md: "0" }} ml={{ md: "auto" }}>
          <CustomButton label="Submit Application" />
        </Box>
      </FormContainer>
    </Stack>
  );
}
