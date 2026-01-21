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

import { useEffect, useState, useRef } from "react";
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
  FieldArray,
  getIn,
} from "formik";
import { array, object, string } from "yup";
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
  Tooltip,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import IconButton from "@mui/material/IconButton";
import {
  calculateServiceLength,
  calculateAge,
  formatServiceLength,
} from "@root/src/utils/utils";

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
  values: FormikValues;
  handleChange: FormikHandlers["handleChange"];
  handleBlur: FormikHandlers["handleBlur"];
  errors: FormikErrors<any>;
  touched: { [field: string]: boolean };
  isSavingChanges: boolean;
  isRequired?: boolean;
}) => {
  const labelWithAsterisk = isRequired ? `${label} *` : label;
  return (
    <TextField
      sx={{
        mt: 1,
        "& .MuiFormHelperText-root": {
          fontSize: 14,
        },
      }}
      label={labelWithAsterisk}
      name={name}
      type={type}
      value={getIn(values, name) || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={isSavingChanges}
      error={getIn(touched, name) && Boolean(getIn(errors, name))}
      helperText={
        getIn(touched, name) && getIn(errors, name)
          ? String(getIn(errors, name))
          : undefined
      }
      variant="outlined"
      InputProps={{ style: { fontSize: 15 } }}
      InputLabelProps={{ style: { fontSize: 15 } }}
      fullWidth
    />
  );
};

export const getEmployeeStatusChipStyles =
  (status?: string) => (theme: Theme) => {
    const normalized = (status ?? "").trim().toLowerCase();
    const isActive = normalized === "active";

    const mainColor = isActive
      ? theme.palette.success.main
      : theme.palette.error.main;

    return {
      borderRadius: 999,
      height: 24,
      fontWeight: 600,
      px: 0,
      color: mainColor,
      borderColor: alpha(mainColor, 0.45),
      backgroundColor: alpha(
        mainColor,
        theme.palette.mode === "dark" ? 0.14 : 0.1,
      ),
      "& .MuiChip-label": {
        px: 0.75,
        py: 0,
        fontSize: 12,
        lineHeight: 1,
        textTransform: "capitalize",
      },
    };
  };

export default function Me() {
  const dispatch = useAppDispatch();
  const { showConfirmation } = useConfirmationModalContext();
  const { userInfo } = useAppSelector((state) => state.user);
  const { employee, state: employeeState } = useAppSelector(
    (state) => state.employee,
  );
  const { personalInfo, state: personalInfoState } = useAppSelector(
    (state) => state.employeePersonalInfo,
  );
  const [isSavingChanges, setSavingChanges] = useState(false);
  const initialHasEmergencyContactsRef = useRef<boolean>(
    !!personalInfo?.emergencyContacts?.length,
  );

  const [shouldRequireEmergencyContacts, setShouldRequireEmergencyContacts] =
    useState<boolean>(initialHasEmergencyContactsRef.current);

  const serviceLength = employee?.startDate
    ? calculateServiceLength(employee.startDate)
    : null;

  const serviceText = formatServiceLength(serviceLength);

  const age = personalInfo?.dob ? calculateAge(personalInfo.dob) : null;

  useEffect(() => {
    const has = (personalInfo?.emergencyContacts?.length ?? 0) > 0;
    initialHasEmergencyContactsRef.current = has;
    setShouldRequireEmergencyContacts(has);
  }, [personalInfo]);

  const personalInfoSchema = object().shape({
    personalEmail: string()
      .nullable()
      .email("Invalid email format")
      .max(254, "Email must be at most 254 characters"),
    personalPhone: string()
      .nullable()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid personal phone number format",
      ),
    residentNumber: string()
      .nullable()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid resident number format",
      ),
    addressLine1: string()
      .nullable()
      .max(255, "Address Line 1 must be at most 255 characters"),
    addressLine2: string()
      .nullable()
      .max(255, "Address Line 2 must be at most 255 characters"),
    city: string().nullable().max(100, "City must be at most 100 characters"),
    country: string()
      .nullable()
      .max(100, "Country must be at most 100 characters"),
    stateOrProvince: string()
      .nullable()
      .max(100, "State/Province must be at most 100 characters"),
    postalCode: string()
      .nullable()
      .max(20, "Postal code must be at most 20 characters"),
    emergencyContacts: shouldRequireEmergencyContacts
      ? array()
          .required("At least one emergency contact is required")
          .min(1, "At least one emergency contact is required")
          .max(4, "Maximum 4 emergency contacts allowed")
          .of(
            object().shape({
              name: string()
                .required("Name is required")
                .max(100, "Name must be at most 100 characters"),
              relationship: string()
                .required("Relationship is required")
                .max(50, "Relationship must be at most 50 characters"),
              telephone: string()
                .required("Telephone is required")
                .matches(
                  /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
                  "Invalid telephone number format",
                ),
              mobile: string()
                .required("Mobile is required")
                .matches(
                  /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
                  "Invalid mobile number format",
                ),
            }),
          )
      : array()
          .nullable()
          .max(4, "Maximum 4 emergency contacts allowed")
          .of(
            object().shape({
              name: string()
                .required("Name is required")
                .max(100, "Name must be at most 100 characters"),
              relationship: string()
                .required("Relationship is required")
                .max(50, "Relationship must be at most 50 characters"),
              telephone: string()
                .required("Telephone is required")
                .matches(
                  /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
                  "Invalid telephone number format",
                ),
              mobile: string()
                .required("Mobile is required")
                .matches(
                  /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
                  "Invalid mobile number format",
                ),
            }),
          ),
  });

  useEffect(() => {
    if (userInfo?.employeeId) {
      dispatch(fetchEmployee(userInfo.employeeId));
      dispatch(fetchEmployeePersonalInfo(userInfo.employeeId));
    }
  }, [userInfo?.employeeId, dispatch]);

  const handleSaveChanges = async (values: EmployeePersonalInfo) => {
    showConfirmation(
      "Confirm Save",
      "Are you sure you want to save these changes?",
      ConfirmationType.update,
      () => savePersonalInfo(values),
      "Save",
      "Cancel",
    );
  };

  const handleDiscardChanges = (resetForm: () => void) => {
    showConfirmation(
      "Discard Changes",
      "Are you sure you want to discard all unsaved changes? This action cannot be undone.",
      ConfirmationType.discard,
      () => {
        resetForm();
        setShouldRequireEmergencyContacts(
          initialHasEmergencyContactsRef.current,
        );
      },
      "Discard",
      "Keep Changes",
    );
  };

  const savePersonalInfo = (values: EmployeePersonalInfo) => {
    try {
      if (employee?.employeeId) {
        const dataToSave = {
          personalEmail: values.personalEmail,
          personalPhone: values.personalPhone,
          residentNumber: values.residentNumber,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2,
          city: values.city,
          stateOrProvince: values.stateOrProvince,
          postalCode: values.postalCode,
          country: values.country,
          emergencyContacts: (values.emergencyContacts || []).map(
            (contact) => ({
              name: contact.name,
              relationship: contact.relationship,
              telephone: contact.telephone,
              mobile: contact.mobile,
            }),
          ),
        };
        setSavingChanges(true);
        dispatch(
          updateEmployeePersonalInfo({
            employeeId: employee.employeeId,
            data: dataToSave,
          }),
        ).finally(() => {
          setSavingChanges(false);
        });
      }
    } catch (err) {
      console.error(err);
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
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton width={120} height={32} />
                    <Skeleton width={80} height={28} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : employee ? (
            <Box>
              <Grid container rowSpacing={1.5} columnSpacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee ID
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employeeId || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Work Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workEmail}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    EPF
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.epf || "-"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Designation
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.designation}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Secondary Job Title
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.secondaryJobTitle || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Business Unit
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.businessUnit || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Team
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.team}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Sub Team
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.subTeam || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Unit
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.unit || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Office
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.office || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employment Location
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employmentLocation || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Work Location
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workLocation || "-"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employment Type
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    {employee.employmentType ? (
                      <Chip
                        label={employee.employmentType}
                        size="small"
                        variant="outlined"
                        sx={(theme) => ({
                          borderRadius: 999,
                          height: 24,
                          fontWeight: 600,
                          px: 0,
                          color: theme.palette.secondary.contrastText,
                          borderColor: alpha(
                            theme.palette.secondary.contrastText,
                            0.45,
                          ),
                          backgroundColor: alpha(
                            theme.palette.secondary.contrastText,
                            theme.palette.mode === "dark" ? 0.14 : 0.1,
                          ),
                          "& .MuiChip-label": {
                            px: 0.75,
                            py: 0,
                            fontSize: 12,
                            lineHeight: 1,
                          },
                        })}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        -
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee Status
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    {employee.employeeStatus ? (
                      <Chip
                        label={employee.employeeStatus}
                        size="small"
                        variant="outlined"
                        sx={getEmployeeStatusChipStyles(
                          employee.employeeStatus,
                        )}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        -
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Start Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.startDate || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Length of Service
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {serviceText}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Probation End Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.probationEndDate || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Agreement End Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.agreementEndDate || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Manager Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.managerEmail || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Additional Manager Emails
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.additionalManagerEmails || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Subordinate Count
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.subordinateCount ?? "-"}
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
                <Grid item xs={12} sm={6} md={4} key={i}>
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
                await handleSaveChanges(values);
              }}
            >
              {({
                values,
                handleChange,
                handleBlur,
                errors,
                touched,
                dirty,
                resetForm,
              }) => (
                <Form>
                  <Grid container rowSpacing={1.5} columnSpacing={3} pt={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Title" value={values.title} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="First Name" value={values.firstName} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Last Name" value={values.lastName} />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="NIC" value={values.nicOrPassport} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Date of Birth" value={values.dob} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Age" value={age ?? "-"} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Gender" value={values.gender} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly
                        label="Nationality"
                        value={values.nationality}
                      />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="personalEmail"
                        label="Personal Email"
                        type="email"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="personalPhone"
                        label="Personal Phone"
                        type="tel"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="residentNumber"
                        label="Resident Number"
                        type="tel"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="addressLine1"
                        label="Address Line 1"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="addressLine2"
                        label="Address Line 2"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="city"
                        label="City"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="stateOrProvince"
                        label="State/Province"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="country"
                        label="Country"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldInput
                        name="postalCode"
                        label="Postal Code"
                        values={values}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        errors={errors}
                        touched={touched}
                        isSavingChanges={isSavingChanges}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FieldArray name="emergencyContacts">
                        {({ push, remove }) => (
                          <Box sx={{ pt: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                              }}
                            >
                              <Typography sx={{ fontWeight: 600 }}>
                                Emergency Contacts (
                                {values.emergencyContacts?.length ?? 0}/4)
                              </Typography>
                            </Box>

                            {touched.emergencyContacts &&
                              typeof errors.emergencyContacts === "string" && (
                                <Typography
                                  color="error"
                                  variant="body2"
                                  sx={{ mt: 1, mb: 2 }}
                                >
                                  {errors.emergencyContacts}
                                </Typography>
                              )}

                            {!values.emergencyContacts ||
                            values.emergencyContacts.length === 0 ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textAlign: "center", py: 3 }}
                              >
                                No emergency contacts added yet.
                              </Typography>
                            ) : (
                              values.emergencyContacts.map((_, index) => (
                                <Grid
                                  container
                                  rowSpacing={1.5}
                                  columnSpacing={3}
                                  key={index}
                                  sx={{ mb: 2 }}
                                >
                                  <Grid item xs={12} sm={6} md={3}>
                                    <FieldInput
                                      name={`emergencyContacts.${index}.name`}
                                      label="Name"
                                      values={values}
                                      handleChange={handleChange}
                                      handleBlur={handleBlur}
                                      errors={errors}
                                      touched={touched}
                                      isSavingChanges={isSavingChanges}
                                      isRequired
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6} md={3}>
                                    <FieldInput
                                      name={`emergencyContacts.${index}.relationship`}
                                      label="Relationship"
                                      values={values}
                                      handleChange={handleChange}
                                      handleBlur={handleBlur}
                                      errors={errors}
                                      touched={touched}
                                      isSavingChanges={isSavingChanges}
                                      isRequired
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6} md={3}>
                                    <FieldInput
                                      name={`emergencyContacts.${index}.telephone`}
                                      label="Telephone"
                                      type="tel"
                                      values={values}
                                      handleChange={handleChange}
                                      handleBlur={handleBlur}
                                      errors={errors}
                                      touched={touched}
                                      isSavingChanges={isSavingChanges}
                                      isRequired
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6} md={3}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      <FieldInput
                                        name={`emergencyContacts.${index}.mobile`}
                                        label="Mobile"
                                        type="tel"
                                        values={values}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        errors={errors}
                                        touched={touched}
                                        isSavingChanges={isSavingChanges}
                                        isRequired
                                      />

                                      <Tooltip
                                        title={
                                          (values.emergencyContacts?.length ??
                                            0) <= 1
                                            ? "At least one emergency contact is required"
                                            : "Remove contact"
                                        }
                                      >
                                        <span>
                                          <IconButton
                                            color="error"
                                            size="small"
                                            onClick={() =>
                                              (values.emergencyContacts
                                                ?.length ?? 0) > 1 &&
                                              remove(index)
                                            }
                                            disabled={
                                              isSavingChanges ||
                                              (values.emergencyContacts
                                                ?.length ?? 0) === 1
                                            }
                                            sx={{ flexShrink: 0 }}
                                          >
                                            <RemoveCircleOutlineIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Box>
                                  </Grid>
                                </Grid>
                              ))
                            )}
                            <Button
                              variant="outlined"
                              color="secondary"
                              startIcon={<AddCircleOutlineIcon />}
                              sx={{ textTransform: "none" }}
                              onClick={() => {
                                push({
                                  name: "",
                                  relationship: "",
                                  telephone: "",
                                  mobile: "",
                                });
                                setShouldRequireEmergencyContacts(true);
                              }}
                              disabled={
                                isSavingChanges ||
                                (values.emergencyContacts?.length ?? 0) >= 4
                              }
                            >
                              Add Contact
                            </Button>

                            {(values.emergencyContacts?.length ?? 0) >= 4 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "block",
                                  textAlign: "center",
                                  mt: 1,
                                }}
                              >
                                Maximum 4 emergency contacts reached.
                              </Typography>
                            )}
                          </Box>
                        )}
                      </FieldArray>
                    </Grid>
                    <Grid item xs={12}>
                      {/* --- Action Buttons --- */}
                      <Box
                        sx={{
                          mt: 3,
                          width: "100%",
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 2,
                        }}
                      >
                        <Button
                          startIcon={<RestartAltIcon />}
                          sx={{ textTransform: "none" }}
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            handleDiscardChanges(resetForm);
                          }}
                          disabled={isSavingChanges || !dirty}
                        >
                          Discard Changes
                        </Button>
                        <Button
                          startIcon={<SaveIcon />}
                          sx={{ textTransform: "none" }}
                          variant="contained"
                          color="secondary"
                          type="submit"
                          disabled={isSavingChanges || !dirty}
                        >
                          {isSavingChanges ? "Saving..." : "Save Changes"}
                        </Button>
                      </Box>
                    </Grid>
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
