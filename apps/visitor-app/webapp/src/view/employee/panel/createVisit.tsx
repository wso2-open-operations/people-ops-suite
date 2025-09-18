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
// under the License
import React, { useCallback, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid,
  TextField,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Check,
} from "@mui/icons-material";
import { FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { PhoneNumberUtil } from "google-libphonenumber";
import { useConfirmationModalContext } from "@root/src/context/DialogContext";
import { ConfirmationType, State } from "@root/src/types/types";
import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@root/src/slices/store";
import FloorRoomSelector from "@view/employee/component/floorRoomSelector";
import {
  addVisitor,
  fetchVisitor,
  resetSubmitState as resetVisitorSubmitState,
} from "@slices/visitorSlice/visitor";
import { hash } from "@root/src/utils/utils";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";
import { enqueueSnackbarMessage } from "@root/src/slices/commonSlice/common";
import { addVisit } from "@root/src/slices/visitSlice/visit";
import { sendInvitation } from "@slices/invitationSlice/invitationSlice";

dayjs.extend(utc);

enum VisitorStatus {
  Draft = "Draft",
  Existing = "Existing",
  Completed = "Completed",
}

export interface VisitorDetail {
  idPassportNumber: string;
  fullName: string;
  contactNumber: string;
  countryCode: string;
  emailAddress: string;
  passNumber: string;
  status: VisitorStatus;
}

const steps = ["Visit Information", "Visitor Information"];

const AVAILABLE_FLOORS_AND_ROOMS = [
  { floor: "1st Floor", rooms: ["Cafeteria"] },
  { floor: "6th Floor", rooms: ["The Launchpad"] },
  { floor: "7th Floor", rooms: ["CloudScape", "DigIntel", "TerminalX"] },
  { floor: "8th Floor", rooms: ["Octave", "Melody"] },
  { floor: "9th Floor", rooms: ["Grove", "Orchard"] },
  { floor: "9th and 10th", rooms: ["The Circuit"] },
  { floor: "10th Floor", rooms: ["Elevate Zone", "Chamber"] },
  { floor: "11th Floor", rooms: ["Tinker Room"] },
  { floor: "12th Floor", rooms: ["Emerald", "Synergy"] },
  { floor: "13th Floor", rooms: ["Quarter Crunch", "Deal Den"] },
  { floor: "14th Floor", rooms: ["Cove", "Skyline", "Pinnacle", "Vertex"] },
];

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+7", country: "RU/KZ", flag: "🇷🇺🇰🇿" },
  { code: "+20", country: "EG", flag: "🇪🇬" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+32", country: "BE", flag: "🇧🇪" },
  { code: "+46", country: "SE", flag: "🇸🇪" },
  { code: "+47", country: "NO", flag: "🇳🇴" },
  { code: "+48", country: "PL", flag: "🇵🇱" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
  { code: "+41", country: "CH", flag: "🇨🇭" },
  { code: "+43", country: "AT", flag: "🇦🇹" },
  { code: "+60", country: "MY", flag: "🇲🇾" },
  { code: "+62", country: "ID", flag: "🇮🇩" },
  { code: "+63", country: "PH", flag: "🇵🇭" },
  { code: "+64", country: "NZ", flag: "🇳🇿" },
  { code: "+66", country: "TH", flag: "🇹🇭" },
  { code: "+90", country: "TR", flag: "🇹🇷" },
  { code: "+92", country: "PK", flag: "🇵🇰" },
  { code: "+95", country: "MM", flag: "🇲🇲" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+972", country: "IL", flag: "🇮🇱" },
  { code: "+973", country: "BH", flag: "🇧🇭" },
  { code: "+974", country: "QA", flag: "🇶🇦" },
  { code: "+975", country: "BT", flag: "🇧🇹" },
  { code: "+976", country: "MN", flag: "🇲🇳" },
  { code: "+977", country: "NP", flag: "🇳🇵" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+886", country: "TW", flag: "🇹🇼" },
  { code: "+880", country: "BD", flag: "🇧🇩" },
  { code: "+84", country: "VN", flag: "🇻🇳" },
  { code: "+94", country: "LK", flag: "🇱🇰" },
];

const visitValidationSchema = Yup.object().shape({
  whoTheyMeet: Yup.string().required("Who they meet is required"),
  purposeOfVisit: Yup.string().required("Purpose of visit is required"),
  accessibleLocations: Yup.array().test(
    "Accessible floors are required",
    "At least one accessible floor is required",
    (value) => Array.isArray(value) && value.length > 0
  ),
  scheduledDate: Yup.string().required("Scheduled date is required"),
  timeOfEntry: Yup.string()
    .required("Time of entry is required")
    .test("is-valid-time", "Time of entry cannot be passed", (value) => {
      if (dayjs(value).isBefore(dayjs())) {
        return false;
      }
      return true;
    }),
  timeOfDeparture: Yup.string()
    .required("Time of departure is required")
    .test(
      "is-valid-time",
      "Time of departure should be after the Time of entry",
      (value, context) => {
        const { timeOfEntry } = context.parent;
        if (dayjs(value).isBefore(dayjs(timeOfEntry))) {
          return false;
        }
        return true;
      }
    ),
});

const visitorValidationSchema = Yup.object().shape({
  visitors: Yup.array().when("invitationOption", {
    is: "addVisitor",
    then: Yup.array().of(
      Yup.object().shape({
        idPassportNumber: Yup.string()
          .required("ID/Passport number is required")
          .test("duplicate", "Visitor already registered", function (value) {
            const { path, parent, options } = this;
            const visitors = options.context?.visitors || [];
            if (!value) return true;
            const firstIndex = visitors.findIndex(
              (v: any) => v.idPassportNumber === value
            );
            const currentIndex = visitors.indexOf(parent);
            return currentIndex === firstIndex;
          }),
        fullName: Yup.string().required("Full name is required"),
        contactNumber: Yup.string()
          .required("Contact number is required")
          .matches(/^\d{6,12}$/, "Invalid contact number"),
        emailAddress: Yup.string().email("Invalid email address"),
        passNumber: Yup.string().required("Pass number is required"),
      })
    ),
    otherwise: Yup.array().notRequired(),
  }),
  invitationOption: Yup.string().required("Please select an option"),
  invitationEmail: Yup.string().when("invitationOption", {
    is: "sendInvitation",
    then: Yup.string()
      .email("Invalid email address")
      .required("Invitation email is required"),
    otherwise: Yup.string(),
  }),
  inviteeCount: Yup.number().when("invitationOption", {
    is: "sendInvitation",
    then: Yup.number()
      .min(1, "At least one invitee is required")
      .required("Invitee count is required"),
    otherwise: Yup.number(),
  }),
});

const renderStepContent = (
  step: number,
  formik: any,
  fetchVisitorByNic: any
) => {
  switch (step) {
    case 0:
      return (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
            >
              <BusinessIcon color="primary" />
              Visit Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="companyName"
                  label="Name of the Company"
                  value={formik.values.companyName}
                  onChange={formik.handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="whoTheyMeet"
                  label="Whom They Meet"
                  value={formik.values.whoTheyMeet}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.whoTheyMeet &&
                    Boolean(formik.errors.whoTheyMeet)
                  }
                  helperText={
                    formik.touched.whoTheyMeet && formik.errors.whoTheyMeet
                  }
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="purposeOfVisit"
                  label="Purpose Of Visit / Comment"
                  value={formik.values.purposeOfVisit}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.purposeOfVisit &&
                    Boolean(formik.errors.purposeOfVisit)
                  }
                  helperText={
                    formik.touched.purposeOfVisit &&
                    formik.errors.purposeOfVisit
                  }
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 4 }} />
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <BusinessIcon color="primary" />
              Floors and Rooms *
            </Typography>
            <FloorRoomSelector
              availableFloorsAndRooms={AVAILABLE_FLOORS_AND_ROOMS}
              selectedFloorsAndRooms={formik.values.accessibleLocations}
              onChange={(value) => {
                formik.setFieldValue("accessibleLocations", value);
              }}
              error={
                formik.touched.accessibleLocations &&
                formik.errors.accessibleLocations
              }
            />
          </Box>
          <Divider sx={{ my: 4 }} />
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
            >
              <ScheduleIcon color="primary" />
              Schedule Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Scheduled Date *"
                  name="scheduledDate"
                  value={
                    formik.values.scheduledDate
                      ? dayjs(formik.values.scheduledDate)
                      : null
                  }
                  onChange={(value) => {
                    formik.setFieldValue(
                      "scheduledDate",
                      dayjs(value).format("YYYY-MM-DD")
                    );
                  }}
                  minDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error:
                        formik.touched.scheduledDate &&
                        Boolean(formik.errors.scheduledDate),
                      helperText:
                        formik.touched.scheduledDate &&
                        formik.errors.scheduledDate,
                      onBlur: () =>
                        formik.setFieldTouched("scheduledDate", true),
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TimePicker
                  label="Time Of Entry *"
                  name="timeOfEntry"
                  value={
                    formik.values.timeOfEntry
                      ? dayjs(formik.values.timeOfEntry)
                      : null
                  }
                  onChange={(value) => {
                    formik.setFieldValue(
                      "timeOfEntry",
                      formik.values.scheduledDate +
                        "T" +
                        dayjs(value).format(
                          "HH:mm:ss" + dayjs(value).format("Z")
                        )
                    );
                  }}
                  disabled={formik.values.scheduledDate === ""}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error:
                        formik.touched.timeOfEntry &&
                        Boolean(formik.errors.timeOfEntry),
                      helperText:
                        formik.touched.timeOfEntry && formik.errors.timeOfEntry,
                      onBlur: () => formik.setFieldTouched("timeOfEntry", true),
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TimePicker
                  label="Time Of Departure *"
                  name="timeOfDeparture"
                  value={
                    formik.values.timeOfDeparture
                      ? dayjs(formik.values.timeOfDeparture)
                      : null
                  }
                  onChange={(value) => {
                    formik.setFieldValue(
                      "timeOfDeparture",
                      formik.values.scheduledDate +
                        "T" +
                        dayjs(value).format(
                          "HH:mm:ss" + dayjs(value).format("Z")
                        )
                    );
                  }}
                  disabled={formik.values.timeOfEntry === ""}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error:
                        formik.touched.timeOfDeparture &&
                        Boolean(formik.errors.timeOfDeparture),
                      helperText:
                        formik.touched.timeOfDeparture &&
                        formik.errors.timeOfDeparture,
                      onBlur: () =>
                        formik.setFieldTouched("timeOfDeparture", true),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 4 }} />
        </>
      );
    case 1:
      return (
        <>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{
                  mb: 2,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  textAlign: "center",
                  color: "text.primary",
                }}
              >
                Visitor Registration Option
              </FormLabel>
              <RadioGroup
                row
                name="invitationOption"
                value={formik.values.invitationOption}
                onChange={(e) => {
                  const newValue = e.target.value;
                  formik.setFieldValue("invitationOption", newValue);
                  formik.setFieldValue("invitationEmail", "");
                  formik.setFieldValue("inviteeCount", "");
                  formik.setFieldValue(
                    "visitors",
                    newValue === "sendInvitation"
                      ? []
                      : [
                          {
                            idPassportNumber: "",
                            fullName: "",
                            contactNumber: "",
                            countryCode: "+94",
                            emailAddress: "",
                            passNumber: "",
                            status: VisitorStatus.Draft,
                          },
                        ]
                  );
                  formik.setTouched({ visitors: [] });
                }}
                sx={{ justifyContent: "center", gap: 2 }}
              >
                {[
                  { value: "addVisitor", label: "Add Visitors Directly" },
                  { value: "sendInvitation", label: "Send Invitation" },
                ].map((option) => {
                  const selected =
                    formik.values.invitationOption === option.value;
                  return (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio sx={{ display: "none" }} />}
                      label={option.label}
                      sx={{
                        px: 3,
                        py: 1.2,
                        borderRadius: 50,
                        fontWeight: 500,
                        fontSize: "0.95rem",
                        bgcolor: selected ? "primary.main" : "grey.100",
                        color: selected ? "white" : "text.primary",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: selected ? "primary.dark" : "grey.200",
                        },
                      }}
                    />
                  );
                })}
              </RadioGroup>
              {formik.touched.invitationOption &&
                formik.errors.invitationOption && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 1, textAlign: "center" }}
                  >
                    {formik.errors.invitationOption}
                  </Typography>
                )}
            </FormControl>
          </Box>
          {formik.values.invitationOption === "addVisitor" && (
            <FieldArray name="visitors">
              {({ remove }) => (
                <>
                  {formik.values.visitors.map(
                    (visitor: VisitorDetail, index: number) => (
                      <Card variant="outlined" sx={{ mb: 2 }} key={index}>
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <Typography
                              variant="h6"
                              component="h3"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <PersonIcon color="primary" />
                              Visitor {index + 1}
                            </Typography>
                            {formik.values.visitors.length > 1 &&
                              visitor.status === VisitorStatus.Draft && (
                                <IconButton
                                  onClick={() => remove(index)}
                                  color="error"
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                          </Box>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="ID/Passport Number"
                                name={`visitors.${index}.idPassportNumber`}
                                value={visitor.idPassportNumber}
                                onChange={(event) => {
                                  formik.setFieldValue(
                                    `visitors.${index}.idPassportNumber`,
                                    event.target.value.toUpperCase()
                                  );
                                }}
                                onBlur={() => {
                                  formik.setFieldTouched(
                                    `visitors.${index}.idPassportNumber`,
                                    true
                                  );
                                  fetchVisitorByNic(
                                    visitor.idPassportNumber,
                                    index,
                                    formik
                                  );
                                }}
                                error={
                                  formik.touched.visitors?.[index]
                                    ?.idPassportNumber &&
                                  Boolean(
                                    formik.errors.visitors?.[index]
                                      ?.idPassportNumber
                                  )
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.idPassportNumber &&
                                  formik.errors.visitors?.[index]
                                    ?.idPassportNumber
                                }
                                variant="outlined"
                                disabled={
                                  visitor.status === VisitorStatus.Completed
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Full Name"
                                name={`visitors.${index}.fullName`}
                                value={visitor.fullName}
                                onChange={formik.handleChange}
                                onBlur={() =>
                                  formik.setFieldTouched(
                                    `visitors.${index}.fullName`,
                                    true
                                  )
                                }
                                error={
                                  formik.touched.visitors?.[index]?.fullName &&
                                  Boolean(
                                    formik.errors.visitors?.[index]?.fullName
                                  )
                                }
                                helperText={
                                  formik.touched.visitors?.[index]?.fullName &&
                                  formik.errors.visitors?.[index]?.fullName
                                }
                                variant="outlined"
                                disabled={
                                  visitor.status === VisitorStatus.Completed
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Contact Number"
                                name={`visitors.${index}.contactNumber`}
                                value={visitor.contactNumber}
                                onChange={formik.handleChange}
                                onBlur={() =>
                                  formik.setFieldTouched(
                                    `visitors.${index}.contactNumber`,
                                    true
                                  )
                                }
                                error={
                                  formik.touched.visitors?.[index]
                                    ?.contactNumber &&
                                  Boolean(
                                    formik.errors.visitors?.[index]
                                      ?.contactNumber
                                  )
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.contactNumber &&
                                  formik.errors.visitors?.[index]?.contactNumber
                                }
                                variant="outlined"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <TextField
                                        select
                                        name={`visitors.${index}.countryCode`}
                                        value={visitor.countryCode}
                                        onChange={formik.handleChange}
                                        variant="standard"
                                        sx={{ minWidth: 80 }}
                                        InputProps={{ disableUnderline: true }}
                                        disabled={
                                          visitor.status ===
                                          VisitorStatus.Completed
                                        }
                                      >
                                        {COUNTRY_CODES.map((country) => (
                                          <MenuItem
                                            key={country.code}
                                            value={country.code}
                                          >
                                            {country.flag} {country.code}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    </InputAdornment>
                                  ),
                                }}
                                disabled={
                                  visitor.status === VisitorStatus.Completed
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Email Address"
                                name={`visitors.${index}.emailAddress`}
                                type="email"
                                value={visitor.emailAddress}
                                onChange={formik.handleChange}
                                onBlur={() =>
                                  formik.setFieldTouched(
                                    `visitors.${index}.emailAddress`,
                                    true
                                  )
                                }
                                error={
                                  !!formik.errors.visitors?.[index]
                                    ?.emailAddress
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.emailAddress &&
                                  formik.errors.visitors?.[index]?.emailAddress
                                }
                                variant="outlined"
                                disabled={
                                  visitor.status === VisitorStatus.Completed
                                }
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                name={`visitors.${index}.passNumber`}
                                label="Pass Number"
                                value={visitor.passNumber}
                                onChange={formik.handleChange}
                                onBlur={() =>
                                  formik.setFieldTouched(
                                    `visitors.${index}.passNumber`,
                                    true
                                  )
                                }
                                error={
                                  formik.touched.visitors?.[index]
                                    ?.passNumber &&
                                  Boolean(
                                    formik.errors.visitors?.[index]?.passNumber
                                  )
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.passNumber &&
                                  formik.errors.visitors?.[index]?.passNumber
                                }
                                variant="outlined"
                                disabled={
                                  visitor.status === VisitorStatus.Completed
                                }
                              />
                            </Grid>
                            {visitor.status === VisitorStatus.Draft && (
                              <Grid item xs={12} sx={{ textAlign: "right" }}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<Check />}
                                  onClick={async () => {
                                    const errors = await formik.validateForm();
                                    formik.setTouched({
                                      [`visitors.${index}.idPassportNumber`]:
                                        true,
                                      [`visitors.${index}.fullName`]: true,
                                      [`visitors.${index}.contactNumber`]: true,
                                      [`visitors.${index}.emailAddress`]: true,
                                      [`visitors.${index}.passNumber`]: true,
                                    });
                                    if (Object.keys(errors).length === 0) {
                                      formik.submitForm();
                                    }
                                  }}
                                >
                                  Submit
                                </Button>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    )
                  )}
                </>
              )}
            </FieldArray>
          )}
          {formik.values.invitationOption === "sendInvitation" && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <PersonIcon color="primary" />
                  Send Invitation
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Invitation Email"
                      name="invitationEmail"
                      type="email"
                      value={formik.values.invitationEmail}
                      onChange={formik.handleChange}
                      onBlur={() =>
                        formik.setFieldTouched("invitationEmail", true)
                      }
                      error={
                        formik.touched.invitationEmail &&
                        Boolean(formik.errors.invitationEmail)
                      }
                      helperText={
                        formik.touched.invitationEmail &&
                        formik.errors.invitationEmail
                      }
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Number of Invitees"
                      name="inviteeCount"
                      type="number"
                      value={formik.values.inviteeCount}
                      onChange={formik.handleChange}
                      onBlur={() =>
                        formik.setFieldTouched("inviteeCount", true)
                      }
                      error={
                        formik.touched.inviteeCount &&
                        Boolean(formik.errors.inviteeCount)
                      }
                      helperText={
                        formik.touched.inviteeCount &&
                        formik.errors.inviteeCount
                      }
                      variant="outlined"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: "right" }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Check />}
                      onClick={async () => {
                        const errors = await formik.validateForm();
                        formik.setTouched({
                          invitationEmail: true,
                          inviteeCount: true,
                          invitationOption: true,
                        });
                        if (Object.keys(errors).length === 0) {
                          formik.submitForm();
                        }
                      }}
                    >
                      Send Invitation
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </>
      );
    default:
      return <div>Not Found</div>;
  }
};

function CreateVisit() {
  const dispatch = useAppDispatch();
  const visitorState = useAppSelector((state: RootState) => state.visitor);
  const visitState = useAppSelector((state: RootState) => state.visit);
  const userState = useAppSelector((state: RootState) => state.user);
  const invitationSendState = useAppSelector(
    (state: RootState) => state.invitation
  );
  const dialogContext = useConfirmationModalContext();
  const phoneUtil = PhoneNumberUtil.getInstance();
  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === steps.length - 1;
  const isAnySubmittedVisitor = useCallback((formik: any) => {
    return formik.values.visitors.some(
      (v: VisitorDetail) => v.status === VisitorStatus.Completed
    );
  }, []);
  const defaultVisitor: VisitorDetail = {
    idPassportNumber: "",
    fullName: "",
    contactNumber: "",
    countryCode: "+94",
    emailAddress: "",
    passNumber: "",
    status: VisitorStatus.Draft,
  };

  const addNewVisitorBlock = useCallback(
    (formik: any) => {
      const newVisitor = { ...defaultVisitor };
      formik.setFieldValue("visitors", [...formik.values.visitors, newVisitor]);
    },
    [defaultVisitor]
  );

  const handleNext = useCallback(() => {
    if (!isLastStep) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  }, [isLastStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  const handleClose = useCallback(
    (formik: any) => {
      dialogContext.showConfirmation(
        "Do you want to close the current visit?",
        "Once the visit is closed, you will no longer be able to add new visitors to this visit.",
        ConfirmationType.accept,
        async () => {
          formik.resetForm();
          setActiveStep(0);
        },
        "Yes",
        "Cancel"
      );
    },
    [dialogContext]
  );

  const submitVisit = async (values: any, formikHelpers: any) => {
    if (values.invitationOption === "sendInvitation") {
      if (!dialogContext?.showConfirmation) {
        dispatch(
          enqueueSnackbarMessage({
            message: "Error: Confirmation dialog not available",
            type: "error",
          })
        );
        return;
      }

      dialogContext.showConfirmation(
        "Do you want to send the invitation?",
        `An invitation will be sent to ${values.invitationEmail} for ${values.inviteeCount} invitee(s).`,
        ConfirmationType.accept,
        async () => {
          try {
            const resultAction = await dispatch(
              sendInvitation({
                createdOn: dayjs().utc().format("YYYY-MM-DDTHH:mm:ss"),
                updatedBy: userState.userInfo?.workEmail ?? "",
                updatedOn: dayjs().utc().format("YYYY-MM-DDTHH:mm:ss"),
                isActive: 1,
                noOfInvitations: values.inviteeCount,
                visitDetails: {
                  nameOfCompany: values.companyName,
                  whomTheyMeet: values.whoTheyMeet,
                  purposeOfVisit: values.purposeOfVisit,
                  accessibleLocations: values.accessibleLocations,
                  sheduledDate: values.scheduledDate,
                  timeOfEntry: values.timeOfEntry,
                  timeOfDeparture: values.timeOfDeparture,
                },
                inviteeEmail: values.invitationEmail,
              })
            );

            if (sendInvitation.fulfilled.match(resultAction)) {
              dispatch(
                enqueueSnackbarMessage({
                  message: "Invitation sent successfully!",
                  type: "success",
                })
              );
              formikHelpers.resetForm();
              setActiveStep(0);
            } else {
              dispatch(
                enqueueSnackbarMessage({
                  message: "Failed to send invitation.",
                  type: "error",
                })
              );
            }
          } catch (error) {
            dispatch(
              enqueueSnackbarMessage({
                message: "An error occurred while sending the invitation.",
                type: "error",
              })
            );
          }
        },
        "Yes",
        "Cancel"
      );
    } else {
      const visitor = values.visitors.find(
        (v: VisitorDetail) => v.status === VisitorStatus.Draft
      );
      if (!visitor) {
        dispatch(
          enqueueSnackbarMessage({
            message: "No visitor found to submit!",
            type: "error",
          })
        );
        return;
      }

      const visitorIndex = values.visitors.findIndex(
        (v: VisitorDetail) => v === visitor
      );

      dialogContext.showConfirmation(
        "Do you want to submit this visitor?",
        "Please note, this will add the visitor's information to the system.",
        ConfirmationType.accept,
        async () => {
          try {
            const addVisitorAction = await dispatch(
              addVisitor({
                nicHash: await hash(visitor.idPassportNumber),
                nicNumber: visitor.idPassportNumber,
                name: visitor.fullName,
                contactNumber: visitor.countryCode + visitor.contactNumber,
                email: visitor.emailAddress,
              })
            );

            if (addVisitor.fulfilled.match(addVisitorAction)) {
              formikHelpers.setFieldValue(
                `visitors.${visitorIndex}.status`,
                VisitorStatus.Completed
              );

              const addVisitAction = await dispatch(
                addVisit({
                  nicHash: await hash(visitor.idPassportNumber),
                  companyName: values.companyName,
                  passNumber: visitor.passNumber,
                  whomTheyMeet: values.whoTheyMeet,
                  purposeOfVisit: values.purposeOfVisit,
                  accessibleLocations: values.accessibleLocations,
                  timeOfEntry: dayjs(values.timeOfEntry)
                    .utc()
                    .format("YYYY-MM-DDTHH:mm:ss"),
                  timeOfDeparture: dayjs(values.timeOfDeparture)
                    .utc()
                    .format("YYYY-MM-DDTHH:mm:ss"),
                })
              );

              if (addVisit.rejected.match(addVisitAction)) {
                dispatch(
                  enqueueSnackbarMessage({
                    message: "An error occurred during visit creation.",
                    type: "error",
                  })
                );
                formikHelpers.setFieldValue(
                  `visitors.${visitorIndex}.status`,
                  VisitorStatus.Draft
                );
              }
            }
          } catch (error) {
            dispatch(
              enqueueSnackbarMessage({
                message: "An unexpected error occurred.",
                type: "error",
              })
            );
          } finally {
            dispatch(resetVisitorSubmitState());
          }
        },
        "Yes",
        "Cancel"
      );
    }
  };

  const fetchVisitorByNic = async (
    idPassportNumber: string,
    index: number,
    formik: any
  ) => {
    await dispatch(fetchVisitor(await hash(idPassportNumber))).then(
      (action) => {
        if (fetchVisitor.fulfilled.match(action)) {
          const contactNumber = phoneUtil.parse(action.payload.contactNumber);
          const countryCode = contactNumber.getCountryCode()?.toString() || "";
          const nationalNumber =
            contactNumber.getNationalNumber()?.toString() || "";
          const fetchedVisitor: VisitorDetail = {
            idPassportNumber: action.payload.nicNumber,
            contactNumber: nationalNumber,
            fullName: action.payload.name,
            countryCode: "+" + countryCode,
            emailAddress: action.payload.email || "",
            passNumber: "",
            status: VisitorStatus.Draft,
          };
          formik.setFieldValue(`visitors.${index}`, fetchedVisitor);
        }
      }
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          color="primary"
          sx={{ fontWeight: "bold" }}
        >
          Visitor Pass Registration
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Complete the form below to register your visit
        </Typography>
      </Box>
      <Box>
        <Formik
          initialValues={{
            companyName: "",
            whoTheyMeet: "",
            purposeOfVisit: "",
            accessibleLocations: [],
            scheduledDate: "",
            timeOfEntry: "",
            timeOfDeparture: "",
            visitors: [defaultVisitor],
            invitationOption: "",
            invitationEmail: "",
            inviteeCount: "",
          }}
          validationSchema={
            activeStep === 0 ? visitValidationSchema : visitorValidationSchema
          }
          onSubmit={(values, formikHelpers) => {
            submitVisit(values, formikHelpers);
          }}
        >
          {(formik) => (
            <>
              {(visitorState.state === State.loading ||
                visitorState.submitState === State.loading ||
                invitationSendState.loading) && (
                <BackgroundLoader
                  open={true}
                  message={
                    visitorState.state === State.loading ||
                    visitorState.submitState === State.loading
                      ? visitorState.stateMessage
                      : ""
                  }
                />
              )}
              <Form>
                <Stepper activeStep={activeStep}>
                  {steps.map((label, index) => (
                    <Step key={index}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Box sx={{ mt: 2 }}>
                  {renderStepContent(activeStep, formik, fetchVisitorByNic)}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      activeStep === 0 ? "flex-end" : "space-between",
                    mt: 3,
                    bgcolor: "background.form",
                  }}
                >
                  {isLastStep && (
                    <Button
                      onClick={
                        isAnySubmittedVisitor(formik)
                          ? () => handleClose(formik)
                          : () => handleBack()
                      }
                      color="inherit"
                      variant="contained"
                      sx={{
                        color: "white",
                        bgcolor: "grey.500",
                        "&:hover": { bgcolor: "grey.700" },
                      }}
                    >
                      {isAnySubmittedVisitor(formik) ? "Close" : "Back"}
                    </Button>
                  )}
                  {(!isLastStep ||
                    (isLastStep &&
                      formik.values.invitationOption === "addVisitor")) && (
                    <Button
                      startIcon={isLastStep && <AddIcon />}
                      color="primary"
                      sx={{ color: "white" }}
                      variant="contained"
                      disabled={
                        isLastStep &&
                        formik.values.invitationOption === "addVisitor"
                          ? !formik.values.visitors.every(
                              (v) => v.status === VisitorStatus.Completed
                            )
                          : false
                      }
                      onClick={async () => {
                        if (
                          isLastStep &&
                          formik.values.invitationOption === "addVisitor"
                        ) {
                          addNewVisitorBlock(formik);
                        } else {
                          const errors = await formik.validateForm();
                          if (Object.keys(errors).length === 0) {
                            handleNext();
                          } else {
                            formik.setTouched(
                              Object.keys(errors).reduce((acc: any, key) => {
                                acc[key] = true;
                                return acc;
                              }, {})
                            );
                          }
                        }
                      }}
                    >
                      {isLastStep &&
                      formik.values.invitationOption === "addVisitor"
                        ? "Add Visitor"
                        : "Continue"}
                    </Button>
                  )}
                </Box>
              </Form>
            </>
          )}
        </Formik>
      </Box>
    </Container>
  );
}

export default CreateVisit;
