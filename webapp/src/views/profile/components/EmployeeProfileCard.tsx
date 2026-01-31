// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { Typography, Avatar, Box, useTheme, Chip, Grid } from "@mui/material";
import { useAppSelector } from "@slices/store";
import { selectEmployeeInfo } from "@slices/authSlice";
import { tokens } from "../../../theme";
import { employeeThumbnailResolutionParam } from "@config/constant";
import { shortDateFormat } from "@config/constant";
import dayjs from "dayjs";

export const EmployeeProfileCard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const employeeData = useAppSelector(selectEmployeeInfo);

  const getModifiedEmployeeThumbnail = (thumbnailURL: string) => {
    if (thumbnailURL?.includes(employeeThumbnailResolutionParam.Low)) {
      return thumbnailURL.replace(
        employeeThumbnailResolutionParam.Low,
        employeeThumbnailResolutionParam.High
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
              item
              lg={6}
              md={6}
              xs={12}
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
                src={getModifiedEmployeeThumbnail(
                  employeeData.employeeThumbnail
                )}
              />
              <Typography variant="h2">{employeeData.employeeName}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {employeeData.workEmail}
              </Typography>
            </Grid>
            <Grid item lg={6} md={6} xs={12}>
              <Grid
                container
                alignItems="center"
                spacing={{ md: 5 }}
                sx={{ pt: { md: 10, sm: 15 } }}
              >
                <Grid
                  item
                  lg={3}
                  xs={4}
                  sx={{ textAlign: "end", fontWeight: "600" }}
                >
                  Joined
                </Grid>
                <Grid item lg={9} xs={8}>
                  <Chip label={dayjs(employeeData.startDate).format(shortDateFormat)} />
                </Grid>
              </Grid>

              <Grid
                container
                alignItems="center"
                spacing={{ md: 5 }}
                sx={{ pt: { md: 5, xs: 3 } }}
              >
                <Grid
                  item
                  lg={3}
                  xs={4}
                  sx={{ textAlign: "end", fontWeight: "600" }}
                >
                  Job Role
                </Grid>
                <Grid item lg={9} xs={8}>
                  <Chip label={employeeData.jobRole} />
                </Grid>
              </Grid>

              <Grid
                container
                alignItems="center"
                spacing={{ md: 5 }}
                sx={{ pt: { md: 5, xs: 3 } }}
              >
                <Grid
                  item
                  lg={3}
                  xs={4}
                  sx={{ textAlign: "end", fontWeight: "600" }}
                >
                  Business Unit
                </Grid>
                <Grid item lg={9} xs={8}>
                  <Chip label={employeeData.businessUnit} />
                </Grid>
              </Grid>

              <Grid
                container
                alignItems="center"
                spacing={{ md: 5 }}
                sx={{ pt: { md: 5, xs: 3 } }}
              >
                <Grid
                  item
                  lg={3}
                  xs={4}
                  sx={{ textAlign: "end", fontWeight: "600" }}
                >
                  Department
                </Grid>
                <Grid item lg={9} xs={8}>
                  <Chip
                    label={employeeData.department}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                alignItems="center"
                spacing={{ md: 5 }}
                sx={{ pt: { md: 5, xs: 3 } }}
              >
                <Grid
                  item
                  lg={3}
                  xs={4}
                  sx={{ textAlign: "end", fontWeight: "600" }}
                >
                  Team
                </Grid>
                <Grid item lg={9} xs={8}>
                  <Chip label={employeeData.team || "N/A"} />
                </Grid>
              </Grid>

              <Grid
                container
                alignItems="center"
                spacing={{ md: 5 }}
                sx={{ pt: { md: 5, xs: 3 } }}
              >
                <Grid
                  item
                  lg={3}
                  xs={4}
                  sx={{ textAlign: "end", fontWeight: "600" }}
                >
                  Location
                </Grid>
                <Grid item lg={9} xs={8}>
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
