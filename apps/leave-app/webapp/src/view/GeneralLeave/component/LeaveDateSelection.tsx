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

import { Box, Stack, Typography, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { Info } from "lucide-react";

export default function LeaveDateSelection() {
  const theme = useTheme();

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      width={{ md: "40%" }}
      gap={{ xs: "2rem" }}
    >
      <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
        Select Date(s)
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        justifyContent={{ xs: "space-evenly", md: "space-between" }}
      >
        <DatePicker
          label="From"
          format="ddd, d MMM"
          sx={{ minWidth: "10%" }}
          value={dayjs().add(1, "day")}
        />
        <DatePicker
          label="To"
          format="ddd, d MMM"
          sx={{ minWidth: "10%" }}
          value={dayjs().add(2, "day")}
        />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <Stack
          direction="row"
          justifyContent={{ xs: "space-evenly", md: "space-between" }}
          width="100%"
          marginTop="2rem"
        >
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            Days selected: 2
          </Typography>
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            Working days selected: 2
          </Typography>
        </Stack>
      </Stack>
      <Box
        width="70%"
        marginX="auto"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderRadius: "0.4rem",
          py: "0.5rem",
          px: "2rem",
        }}
      >
        <Info />
        <Typography>Status: Valid Leave Request</Typography>
      </Box>
    </Stack>
  );
}
