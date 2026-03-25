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
import { Avatar, Box, Chip, Grid, Typography, useTheme } from "@mui/material";
import dayjs from "dayjs";

import { employeeThumbnailResolutionParam } from "@config/constant";
import { shortDateFormat } from "@config/constant";
import { selectEmployeeInfo } from "@slices/authSlice/auth";
import { useAppSelector } from "@slices/store";

import { tokens } from "../../../theme";

export const EmployeeProfileCard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const employeeData = useAppSelector(selectEmployeeInfo);

  const getModifiedEmployeeThumbnail = (thumbnailURL: string) => {
    if (thumbnailURL?.includes(employeeThumbnailResolutionParam.Low)) {
      return thumbnailURL.replace(
        employeeThumbnailResolutionParam.Low,
        employeeThumbnailResolutionParam.High,
      );
    }
    return thumbnailURL;
  };

  return (
    <>
      {employeeData && (
        <Box>
          <Grid container>
            <Grid
              size={{ md: 6, xs: 12 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                pt: { md: 15, sm: 10 },
              }}
            >
              <Avatar
                sx={{
                  width: "12em",
                  height: "12em",
                  mb: 3,
                  boxShadow: `0 0 10px ${colors.primary[400]}`,
                }}
                alt="Employee Thumbnail"
                src={getModifiedEmployeeThumbnail(employeeData.employeeThumbnail)}
              />
              <Typography variant="h2">{employeeData.employeeName}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {employeeData.workEmail}
              </Typography>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <Grid
                container
                alignItems="center"
                spacing={{ md: 5 }}
                sx={{ pt: { md: 10, sm: 15 } }}
              >
                <Grid size={{ md: 3, xs: 4 }} sx={{ textAlign: "end", fontWeight: "600" }}>
                  Joined
                </Grid>
                <Grid size={{ md: 9, xs: 8 }}>
                  <Chip label={dayjs(employeeData.startDate).format(shortDateFormat)} />
                </Grid>
              </Grid>

              <Grid container alignItems="center" spacing={{ md: 5 }} sx={{ pt: { md: 5, xs: 3 } }}>
                <Grid size={{ md: 3, xs: 4 }} sx={{ textAlign: "end", fontWeight: "600" }}>
                  Job Role
                </Grid>
                <Grid size={{ md: 9, xs: 8 }}>
                  <Chip label={employeeData.jobRole} />
                </Grid>
              </Grid>

              <Grid container alignItems="center" spacing={{ md: 5 }} sx={{ pt: { md: 5, xs: 3 } }}>
                <Grid size={{ md: 3, xs: 4 }} sx={{ textAlign: "end", fontWeight: "600" }}>
                  Business Unit
                </Grid>
                <Grid size={{ md: 9, xs: 8 }}>
                  <Chip label={employeeData.businessUnit} />
                </Grid>
              </Grid>

              <Grid container alignItems="center" spacing={{ md: 5 }} sx={{ pt: { md: 5, xs: 3 } }}>
                <Grid size={{ md: 3, xs: 4 }} sx={{ textAlign: "end", fontWeight: "600" }}>
                  Department
                </Grid>
                <Grid size={{ md: 9, xs: 8 }}>
                  <Chip label={employeeData.department} />
                </Grid>
              </Grid>

              <Grid container alignItems="center" spacing={{ md: 5 }} sx={{ pt: { md: 5, xs: 3 } }}>
                <Grid size={{ md: 3, xs: 4 }} sx={{ textAlign: "end", fontWeight: "600" }}>
                  Team
                </Grid>
                <Grid size={{ md: 9, xs: 8 }}>
                  <Chip label={employeeData.team || "N/A"} />
                </Grid>
              </Grid>

              <Grid container alignItems="center" spacing={{ md: 5 }} sx={{ pt: { md: 5, xs: 3 } }}>
                <Grid size={{ md: 3, xs: 4 }} sx={{ textAlign: "end", fontWeight: "600" }}>
                  Location
                </Grid>
                <Grid size={{ md: 9, xs: 8 }}>
                  <Chip label={employeeData.location} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      )}
    </>
  );
};
