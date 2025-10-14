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
import { useConfirmationModalContext } from "@context/DialogContext";
import { ConfirmationType } from "@/types/types";
import { useAppDispatch, useAppSelector } from "../../slices/store";
import { fetchEmployee } from "@root/src/slices/employeeSlice/employee";
import {
  EmployeePersonalInfo,
  fetchEmployeePersonalInfo,
  updateEmployeePersonalInfo,
} from "@root/src/slices/employeeSlice/employeePersonalInfo";
import {
  Formik,
  Form,
  FormikHandlers,
  FormikValues,
  FormikErrors,
} from "formik";
import { object, string, number, date } from "yup";
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

const SectionHeader = ({ title }: { title: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
    <Typography
      variant="h5"
      color="primary"
      sx={{ mr: 2, whiteSpace: "nowrap" }}
    >
      {title}
    </Typography>
    <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: "divider" }} />
  </Box>
);

const ReadOnly = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <>
    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      {value || "-"}
    </Typography>
  </>
);

const FieldInput = ({
  name,
  label,
  type = "text",
  isEditMode,
  values,
  handleChange,
  handleBlur,
  errors,
  touched,
  isSavingChanges,
  isRequired = false,
}: {
  name: string;
  label: string;
  type?: string;
  isEditMode: boolean;
  values: FormikValues;
  handleChange: FormikHandlers["handleChange"];
  handleBlur: FormikHandlers["handleBlur"];
  errors: FormikErrors<any>;
  touched: { [field: string]: boolean };
  isSavingChanges: boolean;
  isRequired?: boolean;
}) => {
  const labelWithAsterisk = isRequired ? `${label} *` : label;
  if (!isEditMode) {
    return <ReadOnly label={labelWithAsterisk} value={values[name]} />;
  }
  return (
    <TextField
      sx={{
        mt: 1,
        "& .MuiFormHelperText-root": {
          fontSize: 14,
        },
        '& input[type="date"]::-webkit-calendar-picker-indicator': {
          filter: "invert(0.8)",
        },
      }}
      label={labelWithAsterisk}
      name={name}
      type={type}
      value={values[name] || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={isSavingChanges}
      error={touched[name] && Boolean(errors[name])}
      helperText={
        touched[name] && errors[name] ? String(errors[name]) : undefined
      }
      variant="outlined"
      InputProps={{ style: { fontSize: 15 } }}
      InputLabelProps={{ style: { fontSize: 15 } }}
      fullWidth
    />
  );
};

export default function Me() {
  const dispatch = useAppDispatch();
  const { showConfirmation } = useConfirmationModalContext();
  const { userInfo } = useAppSelector((state) => state.user);
  const { employee, state: employeeState } = useAppSelector(
    (state) => state.employee
  );
  const { personalInfo, state: personalInfoState } = useAppSelector(
    (state) => state.employeePersonalInfo
  );
  const [isEditMode, setEditMode] = useState(false);
  const [isSavingChanges, setSavingChanges] = useState(false);

  const personalInfoSchema = object().shape({
    nic: string()
      .nullable()
      .max(20, "NIC must be at most 20 characters")
      .matches(
        /^[A-Za-z0-9\-\/]+$/,
        "Invalid NIC format — only letters, numbers, / and - are allowed"
      ),
    fullName: string()
      .required("Full name is required")
      .max(150, "Full name must be at most 150 characters"),
    nameWithInitials: string()
      .nullable()
      .max(100, "Too long (max 100 characters)"),
    firstName: string().nullable().max(100, "Too long (max 100 characters)"),
    lastName: string().nullable().max(100, "Too long (max 100 characters)"),
    title: string().nullable().max(100, "Too long (max 100 characters)"),
    dob: date()
      .nullable()
      .max(new Date(), "Date of birth cannot be in the future"),
    age: number()
      .nullable()
      .min(0, "Age cannot be negative")
      .max(120, "Please enter a valid age"),
    personalEmail: string()
      .nullable()
      .email("Invalid email format")
      .max(254, "Email must be at most 254 characters"),
    personalPhone: string()
      .nullable()
      .matches(/^[0-9+\-()\s]{6,20}$/, "Invalid phone number format"),
    homePhone: string()
      .nullable()
      .matches(/^[0-9+\-()\s]{6,20}$/, "Invalid phone number format"),
    address: string()
      .nullable()
      .max(255, "Address must be at most 255 characters"),
    postalCode: string()
      .nullable()
      .max(20, "Postal code must be at most 20 characters"),
    country: string()
      .nullable()
      .max(100, "Country must be at most 100 characters"),
    nationality: string()
      .nullable()
      .max(100, "Nationality must be at most 100 characters"),
  });

  useEffect(() => {
    if (userInfo?.employeeId) {
      dispatch(fetchEmployee(userInfo.employeeId));
      dispatch(fetchEmployeePersonalInfo(userInfo.employeeId));
    }
  }, [userInfo?.employeeId, dispatch]);

  const handleToggleEditMode = (resetForm?: () => void) => {
    setEditMode((prev) => {
      if (!prev) {
        // Entering edit mode
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
        return true;
      } else {
        // Exiting edit mode (cancel)
        if (resetForm) {
          resetForm();
        }
        return false;
      }
    });
  };

  const handleSave = async (values: EmployeePersonalInfo) => {
    showConfirmation(
      "Confirm Save",
      "Are you sure you want to save these changes?",
      ConfirmationType.update,
      () => savePersonalInfo(values),
      "Save",
      "Cancel"
    );
  };

  const savePersonalInfo = (values: EmployeePersonalInfo) => {
    try {
      const { id, ...rest } = values;
      const dataToSave = { ...rest } as EmployeePersonalInfo;
      if (employee?.employeeId) {
        setSavingChanges(true);
        dispatch(
          updateEmployeePersonalInfo({
            employeeId: employee.employeeId,
            data: dataToSave,
          })
        ).finally(() => {
          setSavingChanges(false);
          setEditMode(false);
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingChanges(false);
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
              {[...Array(15)].map((_, i) => (
                <Grid item xs={4} key={i}>
                  <Skeleton width={120} height={32} />
                  <Skeleton width={80} height={28} />
                </Grid>
              ))}
            </Grid>
          ) : personalInfo ? (
            <Formik
              initialValues={personalInfo}
              validationSchema={personalInfoSchema}
              enableReinitialize
              onSubmit={async (values) => {
                await handleSave(values);
              }}
            >
              {({
                values,
                handleChange,
                handleBlur,
                errors,
                touched,
                resetForm,
              }) => (
                <Form>
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
                        sx={{ textTransform: "none" }}
                        variant={isEditMode ? "outlined" : "contained"}
                        color={isEditMode ? "primary" : "secondary"}
                        onClick={() => handleToggleEditMode(resetForm)}
                      >
                        {isEditMode ? "Cancel" : "Edit"}
                      </Button>
                    </Box>

                    {/* --- Identity Section --- */}
                    <Grid item xs={12}>
                      <SectionHeader title="Identity" />
                    </Grid>

                    <Grid item xs={4}>
                      <FieldInput
                        name="title"
                        label="Title"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="firstName"
                        label="First Name"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="lastName"
                        label="Last Name"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="nic"
                        label="NIC"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="nameWithInitials"
                        label="Name with Initials"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="fullName"
                        label="Full Name"
                        isRequired={true}
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>

                    {/* --- Birth & Nationality --- */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <SectionHeader title="Birth & Nationality" />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="dob"
                        label="Date of Birth"
                        type="date"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="age"
                        label="Age"
                        type="number"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="nationality"
                        label="Nationality"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>

                    {/* --- Contact --- */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <SectionHeader title="Contact" />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="personalEmail"
                        label="Personal Email"
                        type="email"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="personalPhone"
                        label="Personal Phone"
                        type="tel"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="homePhone"
                        label="Home Phone"
                        type="tel"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>

                    {/* --- Address --- */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <SectionHeader title="Address" />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="address"
                        label="Address"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="postalCode"
                        label="Postal Code"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FieldInput
                        name="country"
                        label="Country"
                        {...{
                          isEditMode,
                          values,
                          handleChange,
                          handleBlur,
                          errors,
                          touched,
                          isSavingChanges,
                        }}
                      />
                    </Grid>

                    {/* --- Save Button --- */}
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
                          sx={{ textTransform: "none" }}
                          variant="contained"
                          color="secondary"
                          type="submit"
                          disabled={isSavingChanges}
                        >
                          {isSavingChanges ? "Saving..." : "Save Changes"}
                        </Button>
                      </Box>
                    )}
                  </Grid>
                </Form>
              )}
            </Formik>
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
