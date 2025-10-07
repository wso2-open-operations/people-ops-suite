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

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../slices/store";
import { fetchEmployee } from "@root/src/slices/employeeSlice/employee";
import { fetchEmployeePersonalInfo } from "@root/src/slices/employeeSlice/employeePersonalInfo";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
  Skeleton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function Me() {
  const dispatch = useAppDispatch();
  const { userInfo } = useAppSelector((state) => state.user);
  const { employee, state: employeeState } = useAppSelector(
    (state) => state.employee
  );
  const { personalInfo, state: personalInfoState } = useAppSelector(
    (state) => state.employeePersonalInfo
  );

  useEffect(() => {
    if (userInfo?.employeeId) {
      dispatch(fetchEmployee(userInfo.employeeId));
      dispatch(fetchEmployeePersonalInfo(userInfo.employeeId));
    }
  }, [userInfo?.employeeId, dispatch]);

  return (
    <Box sx={{ mt: 1, pb: 5 }}>
      <Accordion
        defaultExpanded
        sx={{
          borderRadius: 2,
          mb: 2,
          boxShadow: 0,
          border: 1,
          borderColor: "divider",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            General Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {employeeState === "loading" ? (
            <Box>
              <Grid container spacing={2}>
                {[...Array(20)].map((_, i) => (
                  <Grid item xs={4} key={i}>
                    <Skeleton width={120} height={32} />
                    <Skeleton width={80} height={28} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : employee ? (
            <Box>
              <Grid container spacing={2}>
                {/* Identity Section */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ mr: 2, whiteSpace: "nowrap" }}
                    >
                      Identity
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: "1px",
                        backgroundColor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workEmail}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee ID
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employeeId || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    EPF
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.epf || "-"}
                  </Typography>
                </Grid>
                {/* Job & Team Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ mr: 2, whiteSpace: "nowrap" }}
                    >
                      Job & Team
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: "1px",
                        backgroundColor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Job Role
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.jobRole}
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Designation
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.designation}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Team
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.team}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Sub Team
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.subTeam || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Business Unit
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.businessUnit || "-"}
                  </Typography>
                </Grid>
                {/* Location & Office Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ mr: 2, whiteSpace: "nowrap" }}
                    >
                      Location & Office
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: "1px",
                        backgroundColor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee Location
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employeeLocation || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Work Location
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workLocation || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Office
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.office || "-"}
                  </Typography>
                </Grid>
                {/* Dates & Status Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ mr: 2, whiteSpace: "nowrap" }}
                    >
                      Dates & Status
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: "1px",
                        backgroundColor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Start Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.startDate || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employment Type
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employmentType || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee Status
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employeeStatus || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Length of Service
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.lengthOfService
                      ? employee.lengthOfService + " Months"
                      : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Probation End Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.probationEndDate || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Agreement End Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.agreementEndDate || "N/A"}
                  </Typography>
                </Grid>
                {/* Manager & Reporting Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ mr: 2, whiteSpace: "nowrap" }}
                    >
                      Manager & Reporting
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: "1px",
                        backgroundColor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Manager Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.managerEmail || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Report To Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.reportToEmail || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Additional Manager Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.additionalManagerEmail || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Additional Report To Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.additionalReportToEmail || "-"}
                  </Typography>
                </Grid>
                {/* Phone & Relocation Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ mr: 2, whiteSpace: "nowrap" }}
                    >
                      Phone & Relocation
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: "1px",
                        backgroundColor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Work Phone Number
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workPhoneNumber || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Relocation Status
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.relocationStatus || "-"}
                  </Typography>
                </Grid>
                {/* Subordinates Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ mr: 2, whiteSpace: "nowrap" }}
                    >
                      Subordinates
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: "1px",
                        backgroundColor: "divider",
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Subordinate Count
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.subordinateCount ?? "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography color="text.secondary"></Typography>
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion
        defaultExpanded
        sx={{
          borderRadius: 2,
          boxShadow: 0,
          border: 1,
          borderColor: "divider",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ borderRadius: 2, backgroundColor: "background.paper" }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Personal Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {personalInfoState === "loading" ? (
            <Grid container spacing={1}>
              {/* Skeletons for all values */}
              {[...Array(15)].map((_, i) => (
                <Grid item xs={4} key={i}>
                  <Skeleton width={120} height={32} />
                  <Skeleton width={80} height={28} />
                </Grid>
              ))}
            </Grid>
          ) : personalInfo ? (
            <Grid container spacing={1}>
              {/* Identity Section */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ mr: 2, whiteSpace: "nowrap" }}
                  >
                    Identity
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: "1px",
                      backgroundColor: "divider",
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Title
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.title || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  First Name
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.firstName || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Last Name
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.lastName || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  NIC
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.nic || "-"}
                </Typography>
              </Grid>
              {/* Demographics Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ mr: 2, whiteSpace: "nowrap" }}
                  >
                    Birth & Nationality
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: "1px",
                      backgroundColor: "divider",
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Date of Birth
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.dob || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Age
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.age ?? "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Nationality
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.nationality || "-"}
                </Typography>
              </Grid>
              {/* Contact Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ mr: 2, whiteSpace: "nowrap" }}
                  >
                    Contact
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: "1px",
                      backgroundColor: "divider",
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Personal Email
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.personalEmail || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Personal Phone
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.personalPhone || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Home Phone
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.homePhone || "-"}
                </Typography>
              </Grid>
              {/* Address Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ mr: 2, whiteSpace: "nowrap" }}
                  >
                    Address
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: "1px",
                      backgroundColor: "divider",
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Address
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.address || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Postal Code
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.postalCode || "-"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Country
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalInfo.country || "-"}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary"></Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
