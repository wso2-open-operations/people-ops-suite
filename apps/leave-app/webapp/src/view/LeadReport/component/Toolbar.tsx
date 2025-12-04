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

import { Button, Checkbox, FormControlLabel, Stack, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import Title from "@root/src/component/common/Title";

export default function Toolbar() {
  const theme = useTheme();

  return (
    <Stack direction="row" width="100%" alignItems="center">
      <Title firstWord="Lead" secondWord="Report" />

      <Stack direction="row" ml="auto" gap="1rem" alignItems="center">
        <DatePicker label="From" format="ddd, d MMM" />
        <DatePicker label="To" format="ddd, d MMM" />
        <FormControlLabel
          control={<Checkbox color="primary" />}
          label="Include indirect reports"
          sx={{
            color: theme.palette.text.primary,
            "& .MuiFormControlLabel-label": {
              color: theme.palette.text.primary,
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ width: "fit-content", height: "fit-content", px: "3rem", py: "0.5rem" }}
        >
          Fetch Report
        </Button>
      </Stack>
    </Stack>
  );
}
