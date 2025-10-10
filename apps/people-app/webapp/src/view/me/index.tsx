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

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../slices/store";
import { fetchEmployee } from "@root/src/slices/employeeSlice/employee";
import {
  EmployeePersonalInfo,
  fetchEmployeePersonalInfo,
  updateEmployeePersonalInfo,
} from "@root/src/slices/employeeSlice/employeePersonalInfo";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
  Skeleton,
  Button,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

export default function Me() {
  const dispatch = useAppDispatch();
  const { userInfo } = useAppSelector((state) => state.user);
  const { employee, state: employeeState } = useAppSelector(
    (state) => state.employee
  );
  const { personalInfo, state: personalInfoState } = useAppSelector(
    (state) => state.employeePersonalInfo
  );
  const [isEditMode, setEditMode] = useState(false);
  const [isSavingChanges, setSavingChanges] = useState(false);
  const [editableInfo, setEditableInfo] = useState<EmployeePersonalInfo>();

  useEffect(() => {
    if (userInfo?.employeeId) {
      dispatch(fetchEmployee(userInfo.employeeId));
      dispatch(fetchEmployeePersonalInfo(userInfo.employeeId));
    }
  }, [userInfo?.employeeId, dispatch]);

  const handleToggleEditMode = () => {
    const nextEditing = !isEditMode;
    setEditMode(nextEditing);
    if (personalInfo && !isEditMode) {
      const { id, ...rest } = personalInfo;
      setEditableInfo({ ...rest } as EmployeePersonalInfo);
    }
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleFieldChange = (
    field: keyof EmployeePersonalInfo,
    value: string | number
  ) => {
    if (editableInfo) {
      setEditableInfo({
        ...editableInfo,
        [field]: value,
      });
    }
  };

  const handleSave = () => {
    if (employee?.employeeId && editableInfo) {
      setSavingChanges(true);
      dispatch(
        updateEmployeePersonalInfo({
          employeeId: employee.employeeId,
          data: editableInfo,
        })
      ).finally(() => {
        setSavingChanges(false);
        setEditMode(false);
      });
    }
  };

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
              <Grid container spacing={1.5}>
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
              <Grid container rowSpacing={1.5} columnSpacing={3}>
                {/* Identity Section */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
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
            <Typography color="text.secondary">
              General information not found.
            </Typography>
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
          {personalInfoState === "loading" && !isSavingChanges ? (
            <Grid container spacing={1.5}>
              {/* Skeletons for all values */}
              {[...Array(15)].map((_, i) => (
                <Grid item xs={4} key={i}>
                  <Skeleton width={120} height={32} />
                  <Skeleton width={80} height={28} />
                </Grid>
              ))}
            </Grid>
          ) : personalInfo ? (
            <Grid container rowSpacing={1.5} columnSpacing={3} pt={2}>
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  startIcon={!isEditMode && <EditIcon />}
                  sx={{
                    textTransform: "none",
                  }}
                  variant={isEditMode ? "outlined" : "contained"}
                  color={isEditMode ? "primary" : "secondary"}
                  onClick={() => handleToggleEditMode()}
                >
                  {isEditMode ? "Cancel" : "Edit"}
                </Button>
              </Box>
              {/* Identity Section */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
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
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Title"
                    fullWidth
                    value={editableInfo?.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Title
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.title || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="First Name"
                    fullWidth
                    value={editableInfo?.firstName || ""}
                    onChange={(e) =>
                      handleFieldChange("firstName", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      First Name
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.firstName || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Last Name"
                    fullWidth
                    value={editableInfo?.lastName || ""}
                    onChange={(e) =>
                      handleFieldChange("lastName", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Last Name
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.lastName || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="NIC"
                    fullWidth
                    value={editableInfo?.nic || ""}
                    onChange={(e) => handleFieldChange("nic", e.target.value)}
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      NIC
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.nic || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Name with Initials"
                    fullWidth
                    value={editableInfo?.nameWithInitials || ""}
                    onChange={(e) =>
                      handleFieldChange("nameWithInitials", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Name with Initials
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.nameWithInitials || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Full Name"
                    fullWidth
                    value={editableInfo?.fullName || ""}
                    onChange={(e) =>
                      handleFieldChange("fullName", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Full Name
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.fullName || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              {/* Demographics Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
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
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Date of Birth"
                    fullWidth
                    value={editableInfo?.dob || ""}
                    onChange={(e) => handleFieldChange("dob", e.target.value)}
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Date of Birth
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.dob || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Age"
                    fullWidth
                    type="number"
                    value={editableInfo?.age ?? ""}
                    onChange={(e) =>
                      handleFieldChange("age", parseInt(e.target.value, 10))
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Age
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.age ?? "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Nationality"
                    fullWidth
                    value={editableInfo?.nationality || ""}
                    onChange={(e) =>
                      handleFieldChange("nationality", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Nationality
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.nationality || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              {/* Contact Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
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
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Personal Email"
                    fullWidth
                    value={editableInfo?.personalEmail || ""}
                    onChange={(e) =>
                      handleFieldChange("personalEmail", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Personal Email
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.personalEmail || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Personal Phone"
                    fullWidth
                    value={editableInfo?.personalPhone || ""}
                    onChange={(e) =>
                      handleFieldChange("personalPhone", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Personal Phone
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.personalPhone || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Home Phone"
                    fullWidth
                    value={editableInfo?.homePhone || ""}
                    onChange={(e) =>
                      handleFieldChange("homePhone", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Home Phone
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.homePhone || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              {/* Address Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
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
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Address"
                    fullWidth
                    value={editableInfo?.address || ""}
                    onChange={(e) =>
                      handleFieldChange("address", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Address
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.address || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Postal Code"
                    fullWidth
                    value={editableInfo?.postalCode || ""}
                    onChange={(e) =>
                      handleFieldChange("postalCode", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Postal Code
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.postalCode || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                {isEditMode ? (
                  <TextField
                    disabled={isSavingChanges}
                    sx={{ mt: 1 }}
                    label="Country"
                    fullWidth
                    value={editableInfo?.country || ""}
                    onChange={(e) =>
                      handleFieldChange("country", e.target.value)
                    }
                    InputProps={{ style: { fontSize: 15 } }}
                    InputLabelProps={{ style: { fontSize: 15 } }}
                  />
                ) : (
                  <>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Country
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {personalInfo.country || "-"}
                    </Typography>
                  </>
                )}
              </Grid>
              {isEditMode && (
                <Box
                  sx={{
                    mt: 3,
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    startIcon={<SaveIcon />}
                    sx={{
                      textTransform: "none",
                    }}
                    variant="contained"
                    color="secondary"
                    onClick={() => handleSave()}
                    disabled={isSavingChanges}
                  >
                    {isSavingChanges ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              )}
            </Grid>
          ) : (
            <Typography color="text.secondary">
              Personal Information not found.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
