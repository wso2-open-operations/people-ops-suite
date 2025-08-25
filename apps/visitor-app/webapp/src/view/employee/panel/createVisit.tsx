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

import React, { useCallback, useEffect, useState } from "react";
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
  {
    floor: "Ground Floor",
    rooms: ["Lobby", "Reception", "Cafe", "Security Office", "Main Entrance"],
  },
  {
    floor: "1st Floor",
    rooms: [
      "Meeting Room A",
      "Meeting Room B",
      "Conference Hall",
      "Common Area",
      "Pantry",
    ],
  },
  {
    floor: "2nd Floor",
    rooms: [
      "Executive Office",
      "Board Room",
      "HR Department",
      "Finance Department",
      "Break Room",
    ],
  },
  {
    floor: "3rd Floor",
    rooms: [
      "IT Department",
      "Development Team",
      "Testing Lab",
      "Server Room",
      "Storage",
    ],
  },
  {
    floor: "4th Floor",
    rooms: [
      "Marketing Department",
      "Sales Team",
      "Customer Service",
      "Training Room",
      "Library",
    ],
  },
  {
    floor: "5th Floor",
    rooms: [
      "Research Lab",
      "Innovation Center",
      "Project Room",
      "Collaboration Space",
      "Quiet Zone",
    ],
  },
];

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+94", country: "LK", flag: "🇱🇰" },
];

// Validation schema for visit information[Step 0]
const visitValidationSchema = Yup.object().shape({
  whoTheyMeet: Yup.string().required("Who they meet is required"),
  purposeOfVisit: Yup.string().required("Purpose of visit is required"),
  accessibleLocations: Yup.array().test(
    "Accessible floors are required",
    "At least one accessible floor is required",
    (value) => {
      return Array.isArray(value) && value.length > 0;
    }
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
      passNumber: Yup.string().required("Pass number is required"),
    })
  ),
});

function CreateVisit() {
  const dispatch = useAppDispatch();
  const visitorState = useAppSelector((state: RootState) => state.visitor);
  const visitState = useAppSelector((state: RootState) => state.visit);
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
                email: visitor.emailAddress,
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
                  timeOfEntry: values.timeOfEntry,
                  timeOfDeparture: values.timeOfDeparture,
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

                {/* Purpose Of Visit */}
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

            {/* Floor and Room Selection */}
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
                {/* Scheduled Date */}
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

                {/* Time Of Entry */}
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
                          formik.touched.timeOfEntry &&
                          formik.errors.timeOfEntry,
                        onBlur: () =>
                          formik.setFieldTouched("timeOfEntry", true),
                      },
                    }}
                  />
                </Grid>

                {/* Time Of Departure */}
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
                                label="ID/Passport Number"
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
                                label="Full Name"
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
                                label="Contact Number"
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
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                name={`visitors.${index}.passNumber`}
                                label="Pass Number"
                                value={visitor.passNumber}
                                onChange={formik.handleChange}
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

                            {/* Submit Button */}
                            {visitor.status === VisitorStatus.Draft && (
                              <Grid item xs={12} sx={{ textAlign: "right" }}>
                                <Button
                                  // variant="outlined"
                                  color="success"
                                  startIcon={<Check />}
                                  onClick={async () => {
                                    await formik.submitForm();
                                    // push({ ...defaultVisitor });
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
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          color="primary"
          sx={{ fontWeight: "bold" }}
        >
          Visitor Pass Registration {visitorState.state}
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
                      color="primary"
                      variant="contained"
                      sx={{ color: "white" }}
                    >
                      {isAnySubmittedVisitor(formik) ? "Close" : "Back"}
                    </Button>
                  )}

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
