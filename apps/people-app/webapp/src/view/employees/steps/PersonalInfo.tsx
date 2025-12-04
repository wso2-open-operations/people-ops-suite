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

import React, { useCallback, useMemo } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Typography,
  useTheme,
  alpha,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useFormikContext, FieldArray } from "formik";
import * as Yup from "yup";
import {
  PersonOutline,
  CakeOutlined,
  ContactPhoneOutlined,
  HomeOutlined,
  ContactEmergencyOutlined,
  AddCircleOutline,
  RemoveCircleOutline,
} from "@mui/icons-material";
import { EmployeeTitle, Countries } from "@root/src/config/constant";
import {
  CreateEmployeeFormValues,
  EmergencyContact,
} from "@root/src/types/types";
import dayjs from "dayjs";

export const personalInfoValidationSchema = Yup.object().shape({
  personalInfo: Yup.object().shape({
    nicOrPassport: Yup.string()
      .required("NIC/Passport is required")
      .matches(
        /^[A-Za-z0-9\- ]{5,20}$/,
        "NIC/Passport must contain only letters, numbers, hyphens, or spaces (5-20 characters)"
      )
      .max(20, "NIC/Passport must be at most 20 characters"),

    fullName: Yup.string()
      .required("Full name is required")
      .max(255, "Full name must be at most 255 characters"),
    nameWithInitials: Yup.string()
      .required("Name with initials is required")
      .max(150, "Name with initials must be at most 150 characters"),
    firstName: Yup.string()
      .required("First name is required")
      .max(100, "First name must be at most 100 characters"),
    lastName: Yup.string()
      .required("Last name is required")
      .max(100, "Last name must be at most 100 characters"),
    title: Yup.string().required("Title is required"),
    dob: Yup.string()
      .transform((value, originalValue) =>
        originalValue === null ? "" : value
      )
      .required("Date of birth is required"),
    personalEmail: Yup.string()
      .email("Invalid email format")
      .max(254, "Email must be at most 254 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    personalPhone: Yup.string()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid personal phone number format"
      )
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    residentNumber: Yup.string()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid resident number format"
      )
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    addressLine1: Yup.string()
      .max(255, "Address Line 1 must be at most 255 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    addressLine2: Yup.string()
      .max(255, "Address Line 2 must be at most 255 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    city: Yup.string()
      .max(100, "City must be at most 100 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    stateOrProvince: Yup.string()
      .max(100, "State/Province must be at most 100 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    postalCode: Yup.string()
      .max(20, "Postal code must be at most 20 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    country: Yup.string()
      .max(100, "Country must be at most 100 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    nationality: Yup.string()
      .required("Nationality is required")
      .max(100, "Nationality must be at most 100 characters"),
    emergencyContacts: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string()
            .required("Name is required")
            .max(255, "Name must be at most 255 characters"),
          relationship: Yup.string()
            .required("Relationship is required")
            .max(100, "Relationship must be at most 100 characters"),
          telephone: Yup.string()
            .matches(
              /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
              "Invalid telephone number format"
            )
            .required("Telephone is required"),
          mobile: Yup.string()
            .matches(
              /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
              "Invalid mobile number format"
            )
            .required("Mobile is required"),
        })
      )
      .min(1, "At least one emergency contact is required")
      .max(4, "Maximum 4 emergency contacts allowed"),
  }),
});

const MemoizedTextField = React.memo(
  ({
    name,
    label,
    required,
    value,
    onChange,
    onBlur,
    error,
    helperText,
    textFieldSx,
  }: any) => (
    <TextField
      fullWidth
      required={required}
      label={label}
      name={name}
      value={value ?? ""}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      sx={textFieldSx}
    />
  )
);

const SectionHeader = React.memo(({ icon, title }: any) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.secondary.contrastText,
            0.2
          )}, ${alpha(theme.palette.secondary.contrastText, 0.1)})`,
          color: theme.palette.secondary.contrastText,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );
});

export default function PersonalInfoStep() {
  const theme = useTheme();
  const { values, handleChange, handleBlur, touched, errors, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();

  const textFieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        "&:hover fieldset": {
          borderColor: alpha(theme.palette.secondary.contrastText, 0.5),
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.secondary.contrastText,
        },
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: theme.palette.secondary.contrastText,
      },
    }),
    [theme]
  );

  const renderField = useCallback(
    (
      field: keyof CreateEmployeeFormValues["personalInfo"],
      label: string,
      required = false
    ) => (
      <MemoizedTextField
        name={`personalInfo.${field}`}
        label={label}
        required={required}
        value={values.personalInfo[field] ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        error={Boolean(
          touched.personalInfo?.[field] && errors.personalInfo?.[field]
        )}
        helperText={
          touched.personalInfo?.[field] && errors.personalInfo?.[field]
        }
        textFieldSx={textFieldSx}
      />
    ),
    [values, errors, touched, handleChange, handleBlur, textFieldSx]
  );

  const icons = useMemo(
    () => ({
      person: <PersonOutline />,
      cake: <CakeOutlined />,
      contact: <ContactPhoneOutlined />,
      home: <HomeOutlined />,
      emergency: <ContactEmergencyOutlined />,
    }),
    []
  );

  const getEmergencyContactError = useCallback(
    (index: number, field: keyof EmergencyContact) => {
      const contactErrors = errors.personalInfo?.emergencyContacts?.[index];
      const contactTouched = touched.personalInfo?.emergencyContacts?.[index];

      if (
        contactErrors &&
        typeof contactErrors === "object" &&
        contactTouched
      ) {
        return contactErrors[field] as string | undefined;
      }
      return undefined;
    },
    [
      errors.personalInfo?.emergencyContacts,
      touched.personalInfo?.emergencyContacts,
    ]
  );

  return (
    <Box sx={{ width: "100%", px: 0 }}>
      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={icons.person} title="Identity" />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              required
              label="Title"
              name="personalInfo.title"
              value={values.personalInfo.title}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.personalInfo?.title && errors.personalInfo?.title
              )}
              helperText={
                touched.personalInfo?.title && errors.personalInfo?.title
              }
              sx={textFieldSx}
            >
              {EmployeeTitle.map((title) => (
                <MenuItem key={title} value={title}>
                  {title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {[
            "firstName",
            "lastName",
            "nameWithInitials",
            "nicOrPassport",
            "fullName",
          ].map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f}>
              {renderField(
                f as keyof CreateEmployeeFormValues["personalInfo"],
                f === "nicOrPassport"
                  ? "NIC/Passport"
                  : f
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase()),
                f === "firstName" ||
                  f === "lastName" ||
                  f === "nameWithInitials" ||
                  f === "nicOrPassport" ||
                  f === "fullName"
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={icons.cake} title="Birth & Nationality" />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Date of Birth"
              value={
                values.personalInfo.dob ? dayjs(values.personalInfo.dob) : null
              }
              onChange={(val) =>
                setFieldValue(
                  "personalInfo.dob",
                  val ? val.format("YYYY-MM-DD") : null
                )
              }
              format="YYYY-MM-DD"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: textFieldSx,
                  required: true,
                  error: Boolean(
                    touched.personalInfo?.dob && errors.personalInfo?.dob
                  ),
                  helperText:
                    touched.personalInfo?.dob && errors.personalInfo?.dob,
                },
              }}
            />
          </Grid>
          {["nationality"].map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f}>
              {renderField(
                f as keyof CreateEmployeeFormValues["personalInfo"],
                f[0].toUpperCase() + f.slice(1),
                f === "nationality"
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={icons.contact} title="Contact" />
        <Grid container spacing={3}>
          {["personalEmail", "personalPhone", "residentNumber"].map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f}>
              {renderField(
                f as keyof CreateEmployeeFormValues["personalInfo"],
                f
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={icons.home} title="Address" />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("addressLine1", "Address Line 1")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("addressLine2", "Address Line 2")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("city", "City")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("stateOrProvince", "State/Province")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("postalCode", "Postal Code")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Country"
              name="personalInfo.country"
              value={values.personalInfo.country || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.personalInfo?.country && errors.personalInfo?.country
              )}
              helperText={
                touched.personalInfo?.country && errors.personalInfo?.country
              }
              sx={textFieldSx}
            >
              {Countries.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={icons.emergency} title="Emergency Contacts" />
        <FieldArray name="personalInfo.emergencyContacts">
          {({ push, remove }) => (
            <>
              {values.personalInfo.emergencyContacts.map((contact, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: alpha(theme.palette.background.paper, 0.5),
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <MemoizedTextField
                        name={`personalInfo.emergencyContacts.${index}.name`}
                        label="Name"
                        value={contact.name || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(getEmergencyContactError(index, "name"))}
                        helperText={getEmergencyContactError(index, "name")}
                        textFieldSx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <MemoizedTextField
                        name={`personalInfo.emergencyContacts.${index}.relationship`}
                        label="Relationship"
                        value={contact.relationship || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(
                          getEmergencyContactError(index, "relationship")
                        )}
                        helperText={getEmergencyContactError(
                          index,
                          "relationship"
                        )}
                        textFieldSx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <MemoizedTextField
                        name={`personalInfo.emergencyContacts.${index}.telephone`}
                        label="Telephone"
                        value={contact.telephone || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(
                          getEmergencyContactError(index, "telephone")
                        )}
                        helperText={getEmergencyContactError(
                          index,
                          "telephone"
                        )}
                        textFieldSx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <MemoizedTextField
                        name={`personalInfo.emergencyContacts.${index}.mobile`}
                        label="Mobile"
                        value={contact.mobile || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(
                          getEmergencyContactError(index, "mobile")
                        )}
                        helperText={getEmergencyContactError(index, "mobile")}
                        textFieldSx={textFieldSx}
                      />
                    </Grid>
                  </Grid>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <IconButton
                      onClick={() => remove(index)}
                      disabled={
                        values.personalInfo.emergencyContacts.length === 1
                      }
                      sx={{
                        color: theme.palette.error.main,
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                        },
                        "&.Mui-disabled": {
                          color: alpha(theme.palette.action.disabled, 0.3),
                        },
                      }}
                    >
                      <RemoveCircleOutline />
                    </IconButton>
                    {index ===
                      values.personalInfo.emergencyContacts.length - 1 &&
                      values.personalInfo.emergencyContacts.length < 4 && (
                        <IconButton
                          onClick={() =>
                            push({
                              name: "",
                              relationship: "",
                              telephone: "",
                              mobile: "",
                            })
                          }
                          sx={{
                            color: theme.palette.secondary.contrastText,
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.secondary.contrastText,
                                0.1
                              ),
                            },
                          }}
                        >
                          <AddCircleOutline />
                        </IconButton>
                      )}
                  </Box>
                </Box>
              ))}
              {touched.personalInfo?.emergencyContacts &&
                typeof errors.personalInfo?.emergencyContacts === "string" && (
                  <Typography
                    color="error"
                    variant="body2"
                    sx={{ mt: 1, ml: 2 }}
                  >
                    {errors.personalInfo.emergencyContacts}
                  </Typography>
                )}
              {values.personalInfo.emergencyContacts.length === 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <IconButton
                    onClick={() =>
                      push({
                        name: "",
                        relationship: "",
                        telephone: "",
                        mobile: "",
                      })
                    }
                    sx={{
                      color: theme.palette.secondary.contrastText,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.secondary.contrastText,
                          0.1
                        ),
                      },
                    }}
                  >
                    <AddCircleOutline />
                    <Typography fontWeight={500}>
                      Add Emergency Contact
                    </Typography>
                  </IconButton>
                </Box>
              )}
            </>
          )}
        </FieldArray>
      </Box>
    </Box>
  );
}
