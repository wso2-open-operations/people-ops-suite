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
  Stack,
  ToggleButtonGroup,
  ToggleButton,
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
import { DatePicker, DateTimePicker, TimePicker } from "@mui/x-date-pickers";
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
import { sendInvitation } from "@slices/invitationSlice/invitation";
import { Role } from "@root/src/slices/authSlice/auth";

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
// Validation schema for visit information
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
  { floor: "15th Floor", rooms: ["Common Area"] },
  { floor: "Rooftop", rooms: ["Basketball Court"] },
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

function CreateVisit() {
  const dispatch = useAppDispatch();
  // const visitorState = useAppSelector((state: RootState) => state.visitor);
  const authState = useAppSelector((state: RootState) => state.auth);
  const visitState = useAppSelector((state: RootState) => state.visit);
  const { visitorState, invitationSendState } = useAppSelector(
    (state: RootState) => ({
      visitorState: state.visitor,
      invitationSendState: state.invitation,
    })
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
  const [registrationMode, setRegistrationMode] = useState<"email" | "direct">(
    "email"
  );

  // Validation schema for invitation information[Step 2]
  const invitationValidationSchema = Yup.object().shape({
    invitationEmail: Yup.string()
      .email("Invalid email")
      .required("Email is required"),
    inviteeCount: Yup.number()
      .min(1, "At least one invitee is required")
      .required("Invitee count is required"),
  });

  // Validation schema for visit information[Step 0]
  const visitValidationSchema = Yup.object().shape({
    whoTheyMeet: Yup.string().required("Who they meet is required"),
    purposeOfVisit: Yup.string().required("Purpose of visit is required"),
    accessibleLocations: Yup.array().test(
      "Accessible floors are required",
      "At least one accessible floor is required",
      (value) => {
        return authState.roles.includes(Role.ADMIN)
          ? Array.isArray(value) && value.length > 0
          : true;
      }
    ),
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
        "is-after-entry",
        "Time of departure must be after time of entry",
        (value, context) => {
          const { timeOfEntry } = context.parent;
          if (!value || !timeOfEntry) return false;
          return dayjs.utc(value).isAfter(dayjs.utc(timeOfEntry));
        }
      ),
  });
  // Validation schema for visitor information[Step 1]
  const visitorValidationSchema = Yup.object().shape({
    visitors: Yup.array().of(
      Yup.object().shape({
        idPassportNumber: Yup.string()
          .required("ID/Passport number is required")
          .test("duplicate", "Visitor already registered", function (value) {
            const { path, parent, options } = this;
            const visitors = options.context?.visitors || [];

            if (!value) return true;

            // find index of the first visitor with this value
            const firstIndex = visitors.findIndex(
              (v: any) => v.idPassportNumber === value
            );

            // find current index (by comparing object reference)
            const currentIndex = visitors.indexOf(parent);

            // Only allow if currentIndex === firstIndex
            return currentIndex === firstIndex;
          }),

        fullName: Yup.string().required("Full name is required"),
        contactNumber: Yup.string()
          .required("Contact number is required")
          .matches(/^\d{6,12}$/, "Invalid contact number"),

        emailAddress: Yup.string().email("Invalid email address"),
        passNumber: authState.roles.includes(Role.ADMIN)
          ? Yup.string().required("Pass number is required")
          : Yup.string(),
      })
    ),
  });

  // Add a new visitor block to the form
  const addNewVisitorBlock = useCallback(
    (formik: any) => {
      const newVisitor = { ...defaultVisitor };
      formik.setFieldValue("visitors", [...formik.values.visitors, newVisitor]);
    },
    [defaultVisitor]
  );

  // Handle going to the next step
  const handleNext = useCallback(() => {
    if (!isLastStep) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  }, [isLastStep, dispatch]);

  // Handle going back to the previous step
  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  // Handle closing the visit form
  const handleClose = useCallback(
    (formik: any) => {
      dialogContext.showConfirmation(
        "Do you want to close the current visit?",
        "Once the visit is closed, you will no longer be able to add new visitors to this visit.",
        ConfirmationType.accept,
        async () => {
          // Reset the form and stepper.
          formik.resetForm();
          setActiveStep(0);
        },
        "Yes",
        "Cancel"
      );
    },
    [dialogContext]
  );

  // Handle form submission for each step
  const submitVisit = useCallback(
    (values: any, formikHelpers: any) => {
      // Find the visitor to submit
      const visitor = values.visitors.find(
        (v: VisitorDetail) => v.status === VisitorStatus.Draft
      );

      // Find the index of the visitor
      const visitorIndex = values.visitors.findIndex(
        (v: VisitorDetail) => v === visitor
      );

      // Show confirmation dialog before submitting
      if (visitor) {
        dialogContext.showConfirmation(
          "Do you want to submit this visitor?",
          "Please note, this will add the visitor's information to the system.",
          ConfirmationType.accept,
          async () => {
            await dispatch(
              addVisitor({
                nicHash: await hash(visitor.idPassportNumber),
                nicNumber: visitor.idPassportNumber,
                name: visitor.fullName,
                contactNumber: visitor.countryCode + visitor.contactNumber,
                email: visitor.emailAddress == "" ? null : visitor.emailAddress,
              })
            ).then(async (action) => {
              // Because of the visitor.submitState change slowness, checking the redux thunk action. this will smooth the UI flow
              if (addVisitor.fulfilled.match(action)) {
                formikHelpers.setFieldValue(
                  `visitors.${visitorIndex}.status`,
                  VisitorStatus.Completed
                );
              }

              dispatch(resetVisitorSubmitState());

              // Submit the visit.
              await dispatch(
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
              ).then((action) => {
                // Chained dependency failure : if the visit submission fails, reset the visitor status to Draft to allow re-submission
                if (addVisit.rejected.match(action)) {
                  dispatch(
                    enqueueSnackbarMessage({
                      message:
                        "An error occurred during visit creation, please try again later.",
                      type: "error",
                    })
                  );
                  formikHelpers.setFieldValue(
                    `visitors.${visitorIndex}.status`,
                    VisitorStatus.Draft
                  );
                }
              });
            });
          },
          "Yes",
          "Cancel"
        );
      } else {
        dispatch(
          enqueueSnackbarMessage({
            message: "No visitor found to submit!",
            type: "error",
          })
        );
      }
    },
    [dispatch]
  );

  const sendInvitationEmails = useCallback(
    (values: any, formikHelpers: any) => {
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
        `Please note, this will send the invitation to: ${values.invitationEmail}`,
        ConfirmationType.accept,
        async () => {
          const resultAction = await dispatch(
            sendInvitation({
              noOfVisitors: Number(values.inviteeCount),
              inviteeEmail: values.invitationEmail,
            })
          );

          if (sendInvitation.fulfilled.match(resultAction)) {
            formikHelpers.resetForm();
            setActiveStep(0);
          }
        },
        "Yes",
        "No"
      );
    },
    []
  );

  // Fetch visitor details based on ID/Passport number
  const fetchVisitorByNic = useCallback(
    async (idPassportNumber: string, index: number, formik: any) => {
      await dispatch(fetchVisitor(await hash(idPassportNumber))).then(
        (action) => {
          if (fetchVisitor.fulfilled.match(action)) {
            const contactNumber = phoneUtil.parse(action.payload.contactNumber);
            const countryCode =
              contactNumber.getCountryCode()?.toString() || "";
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
    },
    [dispatch]
  );

  // Render the content for each step
  const renderStepContent = (step: number, formik: any) => {
    switch (step) {
      case 0:
        return (
          <>
            {/* Basic Information */}
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
                {/* Name of the company */}
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

                {/* Whom They Meet */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="whoTheyMeet"
                    label="Whom They Meet *"
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

                {/* Purpose Of Visit */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="purposeOfVisit"
                    label="Purpose Of Visit / Comment *"
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

            {/* Floor and Room Selection */}
            {authState.roles.includes(Role.ADMIN) && (
              <>
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
              </>
            )}

            {/* Schedule Information */}
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
                {/* Time Of Entry */}
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Time of Entry *"
                    minDateTime={dayjs()}
                    value={
                      formik.values.timeOfEntry
                        ? dayjs.utc(formik.values.timeOfEntry).local()
                        : null
                    }
                    onChange={(value) => {
                      formik.setFieldValue(
                        "timeOfEntry",
                        dayjs(value).utc().format()
                      );

                      formik.setFieldTouched("timeOfEntry", true, false);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error:
                          formik.touched.timeOfEntry &&
                          Boolean(formik.errors.timeOfEntry),
                        helperText:
                          formik.touched.timeOfEntry &&
                          formik.errors.timeOfEntry,
                        onBlur: () =>
                          formik.setFieldTouched("timeOfEntry", true),
                      },
                    }}
                  />
                </Grid>
                {/* Time Of Departure */}
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Time of Departure *"
                    minDateTime={
                      formik.values.timeOfEntry
                        ? dayjs(formik.values.timeOfEntry).local()
                        : dayjs()
                    }
                    value={
                      formik.values.timeOfDeparture
                        ? dayjs.utc(formik.values.timeOfDeparture).local()
                        : null
                    }
                    onChange={(value) => {
                      formik.setFieldValue(
                        "timeOfDeparture",
                        dayjs(value).utc().format()
                      );

                      formik.setFieldTouched("timeOfDeparture", true, false);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error:
                          formik.touched.timeOfDeparture &&
                          Boolean(formik.errors.timeOfDeparture),
                        helperText:
                          formik.touched.timeOfDeparture &&
                          formik.errors.timeOfDeparture,
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

                            {/* Only show delete button if there is more than one visitor */}
                            {formik.values.visitors.length > 1 &&
                              formik.values.visitors[index].status ===
                                VisitorStatus.Draft && (
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
                            {/* Id/Passport Number */}
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="ID/Passport Number *"
                                name={`visitors.${index}.idPassportNumber`}
                                value={visitor.idPassportNumber}
                                onChange={(event) => {
                                  formik.setFieldValue(
                                    `visitors.${index}.idPassportNumber`,
                                    event.target.value.toUpperCase()
                                  );
                                }}
                                onBlur={() =>
                                  fetchVisitorByNic(
                                    visitor.idPassportNumber,
                                    index,
                                    formik
                                  )
                                }
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

                            {/* Full Name */}
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Full Name *"
                                name={`visitors.${index}.fullName`}
                                value={visitor.fullName}
                                onChange={formik.handleChange}
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

                            {/* Contact Number */}
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Contact Number *"
                                name={`visitors.${index}.contactNumber`}
                                value={visitor.contactNumber}
                                onChange={formik.handleChange}
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

                            {/* Email Address */}
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Email Address"
                                name={`visitors.${index}.emailAddress`}
                                type="email"
                                value={visitor.emailAddress}
                                onChange={formik.handleChange}
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

                            {/* Pass Number */}
                            {authState.roles.includes(Role.ADMIN) && (
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  name={`visitors.${index}.passNumber`}
                                  label="Pass Number *"
                                  value={visitor.passNumber}
                                  onChange={formik.handleChange}
                                  error={
                                    formik.touched.visitors?.[index]
                                      ?.passNumber &&
                                    Boolean(
                                      formik.errors.visitors?.[index]
                                        ?.passNumber
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
                            )}

                            {/* Submit Button */}
                            {visitor.status === VisitorStatus.Draft && (
                              <Grid item xs={12} sx={{ textAlign: "right" }}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<Check />}
                                  onClick={async () => {
                                    await formik.submitForm();
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
          </>
        );
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 4,
        }}
      >
        <ToggleButtonGroup
          value={registrationMode}
          exclusive
          onChange={(_, value) => value && setRegistrationMode(value)}
          sx={{
            borderRadius: 50,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "grey.800" : "grey.200",
            p: 0.5,
            width: "fit-content",
          }}
        >
          <ToggleButton
            value="email"
            sx={{
              textTransform: "none",
              border: "none",
              px: 3,
              py: 1,
              fontWeight: 500,
              borderRadius: 50,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { backgroundColor: "primary.dark" },
              },
            }}
          >
            Send Invitation
          </ToggleButton>
          <ToggleButton
            value="direct"
            sx={{
              textTransform: "none",
              border: "none",
              px: 3,
              py: 1,
              fontWeight: 500,
              borderRadius: 50,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { backgroundColor: "primary.dark" },
              },
            }}
          >
            Add Visitors
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Invitation email code block */}
      {registrationMode === "email" && (
        <Formik
          initialValues={{
            invitationEmail: "",
            inviteeCount: 1,
          }}
          validationSchema={invitationValidationSchema}
          onSubmit={(values, formikHelpers) =>
            sendInvitationEmails(values, formikHelpers)
          }
        >
          {(formik) => (
            <>
              {/* Background loader */}
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
              {(visitState.state === State.loading ||
                visitState.submitState === State.loading) && (
                <BackgroundLoader
                  open={true}
                  message={
                    visitState.state === State.loading ||
                    visitState.submitState === State.loading
                      ? visitState.stateMessage
                      : ""
                  }
                />
              )}
              <Form>
                <Box
                  sx={{
                    mb: 3,
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    border: (theme) =>
                      `1px solid ${
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.grey[300]
                      }`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" component="h3">
                      Send Invitation
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Enter the email address and number of invitees. Invitations
                    will be sent automatically after submission.
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Invitation Email */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Invitation Email *"
                        name="invitationEmail"
                        value={formik.values.invitationEmail}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.invitationEmail &&
                          Boolean(formik.errors.invitationEmail)
                        }
                        helperText={
                          <span
                            style={{
                              minHeight: "1.5em",
                              display: "inline-block",
                            }}
                          >
                            {formik.touched.invitationEmail &&
                              formik.errors.invitationEmail}
                          </span>
                        }
                        variant="outlined"
                      />
                    </Grid>

                    {/* Number of Invitees */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Number of Invitees *"
                        name="inviteeCount"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={formik.values.inviteeCount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.inviteeCount &&
                          Boolean(formik.errors.inviteeCount)
                        }
                        helperText={
                          <span
                            style={{
                              minHeight: "1.5em",
                              display: "inline-block",
                            }}
                          >
                            {formik.touched.inviteeCount &&
                              formik.errors.inviteeCount}
                          </span>
                        }
                        variant="outlined"
                      />
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12} display="flex" justifyContent="flex-end">
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        sx={{
                          mt: 1,
                          px: 2,
                          py: 1.3,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Send Invitation
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Form>
            </>
          )}
        </Formik>
      )}

      {/* Stepper code block */}
      {registrationMode === "direct" && (
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
            }}
            validationSchema={
              activeStep === 0 ? visitValidationSchema : visitorValidationSchema
            }
            onSubmit={(values, formikHelpers) =>
              submitVisit(values, formikHelpers)
            }
          >
            {(formik) => (
              <>
                {/* Background loader */}
                {(visitorState.state === State.loading ||
                  visitorState.submitState === State.loading) && (
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
                {(visitState.state === State.loading ||
                  visitState.submitState === State.loading) && (
                  <BackgroundLoader
                    open={true}
                    message={
                      visitState.state === State.loading ||
                      visitState.submitState === State.loading
                        ? visitState.stateMessage
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
                    {renderStepContent(activeStep, formik)}
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
                    {!(
                      isLastStep &&
                      !formik.values.visitors.every(
                        (v) => v.status === VisitorStatus.Completed
                      )
                    ) && (
                      <Button
                        startIcon={isLastStep && <AddIcon />}
                        color="primary"
                        sx={{ color: "white" }}
                        variant="contained"
                        disabled={
                          isLastStep
                            ? !formik.values.visitors.every(
                                (v) => v.status === VisitorStatus.Completed
                              )
                            : false
                        }
                        onClick={async () => {
                          if (isLastStep) {
                            addNewVisitorBlock(formik);
                          } else {
                            // validate step 1
                            const errors = await formik.validateForm();
                            if (Object.keys(errors).length === 0) {
                              handleNext();
                            } else {
                              // mark all touched fields so errors show up
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
                        {isLastStep ? "Add Visitor" : "Continue"}
                      </Button>
                    )}
                  </Box>
                </Form>
              </>
            )}
          </Formik>
        </Box>
      )}
    </Container>
  );
}

export default CreateVisit;
