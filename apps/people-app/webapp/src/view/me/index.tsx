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
  FieldArray,
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import IconButton from "@mui/material/IconButton";

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
  const [isSavingChanges, setSavingChanges] = useState(false);

  const personalInfoSchema = object().shape({
    personalEmail: string()
      .nullable()
      .email("Invalid email format")
      .max(254, "Email must be at most 254 characters"),
    personalPhone: string()
      .nullable()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid personal phone number format"
      ),
    residentNumber: string()
      .nullable()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid resident number format"
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
    emergencyContacts: array()
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
              "Invalid telephone number format"
            ),
          mobile: string()
            .required("Mobile is required")
            .matches(
              /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
              "Invalid mobile number format"
            ),
        })
      )
      .min(1, "At least one emergency contact is required")
      .max(4, "Maximum 4 emergency contacts allowed"),
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
      "Cancel"
    );
  };

  const handleDiscardChanges = (resetForm: () => void) => {
    showConfirmation(
      "Discard Changes",
      "Are you sure you want to discard all unsaved changes? This action cannot be undone.",
      ConfirmationType.discard,
      () => resetForm(),
      "Discard",
      "Keep Changes"
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
            })
          ),
        };
        setSavingChanges(true);
        dispatch(
          updateEmployeePersonalInfo({
            employeeId: employee.employeeId,
            data: dataToSave,
          })
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
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employmentType || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee Status
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employeeStatus || "-"}
                  </Typography>
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
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Work Phone Number
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workPhoneNumber || "-"}
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
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly
                        label="Name with Initials"
                        value={values.nameWithInitials}
                      />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Full Name" value={values.fullName} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="NIC" value={values.nicOrPassport} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Date of Birth" value={values.dob} />
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
                              values.emergencyContacts.map((contact, index) => (
                                <Grid
                                  container
                                  spacing={2}
                                  key={index}
                                  alignItems="center"
                                  sx={{ mb: 2 }}
                                >
                                  <Grid item xs={12} sm={3}>
                                    <TextField
                                      label="Name"
                                      name={`emergencyContacts.${index}.name`}
                                      value={contact.name ?? ""}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      fullWidth
                                      size="medium"
                                      disabled={isSavingChanges}
                                      error={
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.name &&
                                        Boolean(
                                          (errors.emergencyContacts as any)?.[
                                            index
                                          ]?.name
                                        )
                                      }
                                      helperText={
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.name &&
                                        (errors.emergencyContacts as any)?.[
                                          index
                                        ]?.name
                                      }
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={3}>
                                    <TextField
                                      label="Relationship"
                                      name={`emergencyContacts.${index}.relationship`}
                                      value={contact.relationship ?? ""}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      fullWidth
                                      size="medium"
                                      disabled={isSavingChanges}
                                      error={
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.relationship &&
                                        Boolean(
                                          (errors.emergencyContacts as any)?.[
                                            index
                                          ]?.relationship
                                        )
                                      }
                                      helperText={
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.relationship &&
                                        (errors.emergencyContacts as any)?.[
                                          index
                                        ]?.relationship
                                      }
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={2.5}>
                                    <TextField
                                      label="Telephone"
                                      name={`emergencyContacts.${index}.telephone`}
                                      value={contact.telephone ?? ""}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      fullWidth
                                      size="medium"
                                      disabled={isSavingChanges}
                                      error={
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.telephone &&
                                        Boolean(
                                          (errors.emergencyContacts as any)?.[
                                            index
                                          ]?.telephone
                                        )
                                      }
                                      helperText={
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.telephone &&
                                        (errors.emergencyContacts as any)?.[
                                          index
                                        ]?.telephone
                                      }
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={2.5}>
                                    <TextField
                                      label="Mobile"
                                      name={`emergencyContacts.${index}.mobile`}
                                      value={contact.mobile ?? ""}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      fullWidth
                                      size="medium"
                                      disabled={isSavingChanges}
                                      error={Boolean(
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.mobile &&
                                          (errors.emergencyContacts as any)?.[
                                            index
                                          ]?.mobile
                                      )}
                                      helperText={
                                        (touched.emergencyContacts as any)?.[
                                          index
                                        ]?.mobile &&
                                        (errors.emergencyContacts as any)?.[
                                          index
                                        ]?.mobile
                                      }
                                    />
                                  </Grid>
                                  <Grid item sx={{ width: "32px" }}>
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
                                          onClick={() => {
                                            if (
                                              (values.emergencyContacts
                                                ?.length ?? 0) <= 1
                                            ) {
                                              return;
                                            }
                                            remove(index);
                                          }}
                                          disabled={
                                            isSavingChanges ||
                                            (values.emergencyContacts?.length ??
                                              0) <= 1
                                          }
                                        >
                                          <RemoveCircleOutlineIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Grid>
                                </Grid>
                              ))
                            )}
                            <Button
                              variant="outlined"
                              color="secondary"
                              startIcon={<AddCircleOutlineIcon />}
                              sx={{ textTransform: "none" }}
                              onClick={() =>
                                push({
                                  name: "",
                                  relationship: "",
                                  telephone: "",
                                  mobile: "",
                                })
                              }
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
                          onClick={() => handleDiscardChanges(resetForm)}
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
