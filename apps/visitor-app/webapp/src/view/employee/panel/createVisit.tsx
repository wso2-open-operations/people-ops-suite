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

import { useCallback, useState, useMemo, forwardRef } from "react";
import {
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
  Container,
  Autocomplete,
  Avatar,
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
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
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
import { Role } from "@root/src/slices/authSlice/auth";
import { PhoneNumberUtil } from "google-libphonenumber";
import {
  fetchEmployees,
  loadMoreEmployees,
} from "@root/src/slices/employeeSlice/employees";

dayjs.extend(utc);

enum VisitorStatus {
  Draft = "Draft",
  Existing = "Existing",
  Completed = "Completed",
}

export interface VisitorDetail {
  firstName: string;
  lastName: string;
  contactNumber: string;
  countryCode: string;
  emailAddress: string;
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
  { code: "+7", country: "RU/KZ", flag: "🇷🇺" },
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

const defaultVisitor: VisitorDetail = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  countryCode: "+94",
  emailAddress: "",
  status: VisitorStatus.Draft,
};

function CreateVisit() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state: RootState) => state.auth);
  const visitState = useAppSelector((state: RootState) => state.visit);
  const { visitorState } = useAppSelector((state: RootState) => ({
    visitorState: state.visitor,
  }));
  const dialogContext = useConfirmationModalContext();
  const phoneUtil = PhoneNumberUtil.getInstance();
  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === steps.length - 1;

  // Employee slice state
  const employees = useAppSelector((state) => state.employees.employees || []);
  const isLoadingMore = useAppSelector(
    (state) => state.employees.isLoadingMore || false,
  );
  const hasMore = useAppSelector((state) => state.employees.hasMore || false);
  const currentSearchTerm = useAppSelector(
    (state) => state.employees.currentSearchTerm || "",
  );

  const emailToEmployee = useMemo(() => {
    const map: Record<string, any> = {};
    employees.forEach((emp: any) => {
      if (emp.email) map[emp.email] = emp;
    });
    return map;
  }, [employees]);

  // Autocomplete local state
  const [inputValue, setInputValue] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  const isAnySubmittedVisitor = useCallback((formik: any) => {
    return formik.values.visitors.some(
      (v: VisitorDetail) => v.status === VisitorStatus.Completed,
    );
  }, []);

  // Validation schemas
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
      },
    ),
    timeOfEntry: Yup.string().test(
      "is-valid-time",
      "Time of entry cannot be passed",
      (value) => !dayjs(value).isBefore(dayjs()),
    ),
    timeOfDeparture: Yup.string().test(
      "is-after-entry",
      "Time of departure must be after time of entry",
      (value, context) => {
        const { timeOfEntry } = context.parent;
        if (!value || !timeOfEntry) return true;
        return dayjs.utc(value).isAfter(dayjs.utc(timeOfEntry));
      },
    ),
  });

  const visitorValidationSchema = Yup.object().shape({
    visitors: Yup.array().of(
      Yup.object().shape({
        firstName: Yup.string().required("First name is required"),
        lastName: Yup.string().required("Last name is required"),
        contactNumber: Yup.string().matches(
          /^\d{6,12}$/,
          "Invalid contact number",
        ),
        emailAddress: Yup.string()
          .email("Invalid email address")
          .required("Email address is required")
          .test("duplicate", "Visitor already registered", function (value) {
            const visitors = this.options.context?.visitors || [];
            if (!value) return true;
            const firstIndex = visitors.findIndex(
              (v: any) => v.emailAddress === value,
            );
            return visitors.indexOf(this.parent) === firstIndex;
          }),
      }),
    ),
  });

  // ── Search & load more ─────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (_: any, newInputValue: string, reason: string) => {
      setInputValue(newInputValue);

      if (reason === "input" && newInputValue.trim() !== currentSearchTerm) {
        dispatch(fetchEmployees({ searchTerm: newInputValue.trim() }));
      }
    },
    [dispatch, currentSearchTerm],
  );

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLUListElement>) => {
      const node = event.currentTarget;
      if (
        node.scrollHeight - node.scrollTop - node.clientHeight < 150 &&
        !isLoadingMore &&
        hasMore
      ) {
        dispatch(loadMoreEmployees({ searchTerm: inputValue.trim() }));
      }
    },
    [dispatch, isLoadingMore, hasMore, inputValue],
  );

  const CustomListbox = forwardRef<HTMLUListElement, any>((props, ref) => {
    return <ul {...props} ref={ref} onScroll={handleScroll} />;
  });

  const addNewVisitorBlock = useCallback((formik: any) => {
    formik.setFieldValue("visitors", [
      ...formik.values.visitors,
      { ...defaultVisitor },
    ]);
  }, []);

  const handleNext = useCallback(() => setActiveStep((prev) => prev + 1), []);
  const handleBack = useCallback(() => setActiveStep((prev) => prev - 1), []);

  const handleClose = useCallback(
    (formik: any) => {
      dialogContext.showConfirmation(
        "Do you want to close the current visit?",
        "Once the visit is closed, you will no longer be able to add new visitors to this visit.",
        ConfirmationType.accept,
        () => {
          formik.resetForm();
          setActiveStep(0);
        },
        "Yes",
        "Cancel",
      );
    },
    [dialogContext],
  );

  const submitVisit = useCallback(
    (values: any, formikHelpers: any) => {
      const visitor = values.visitors.find(
        (v: VisitorDetail) => v.status === VisitorStatus.Draft,
      );
      const visitorIndex = values.visitors.findIndex(
        (v: VisitorDetail) => v === visitor,
      );

      if (visitor) {
        dialogContext.showConfirmation(
          "Do you want to submit this visitor?",
          "Please note, this will add the visitor's information to the system.",
          ConfirmationType.accept,
          async () => {
            await dispatch(
              addVisitor({
                firstName: visitor.firstName,
                lastName: visitor.lastName,
                email: await hash(visitor.emailAddress),
              }),
            ).then(async (action) => {
              if (addVisitor.fulfilled.match(action)) {
                formikHelpers.setFieldValue(
                  `visitors.${visitorIndex}.status`,
                  VisitorStatus.Completed,
                );
              }
              dispatch(resetVisitorSubmitState());

              await dispatch(
                addVisit({
                  companyName: values.companyName,
                  whomTheyMeet: values.whoTheyMeet,
                  purposeOfVisit: values.purposeOfVisit,
                  accessibleLocations: values.accessibleLocations,
                  timeOfEntry: dayjs(values.timeOfEntry)
                    .utc()
                    .format("YYYY-MM-DDTHH:mm:ss"),
                  timeOfDeparture: dayjs(values.timeOfDeparture)
                    .utc()
                    .format("YYYY-MM-DDTHH:mm:ss"),
                }),
              );
            });
          },
          "Yes",
          "Cancel",
        );
      } else {
        dispatch(
          enqueueSnackbarMessage({
            message: "No visitor found to submit!",
            type: "error",
          }),
        );
      }
    },
    [dispatch, dialogContext],
  );

  const fetchVisitorByEmail = useCallback(
    async (email: string, index: number, formik: any) => {
      await dispatch(fetchVisitor(await hash(email))).then((action) => {
        if (fetchVisitor.fulfilled.match(action)) {
          const contactNumber = phoneUtil.parse(action.payload.contactNumber);
          const countryCode = contactNumber.getCountryCode()?.toString() || "";
          const nationalNumber =
            contactNumber.getNationalNumber()?.toString() || "";
          formik.setFieldValue(`visitors.${index}`, {
            contactNumber: nationalNumber,
            firstName: action.payload.firstName,
            lastName: action.payload.lastName,
            countryCode: "+" + countryCode,
            emailAddress: action.payload.email || "",
            status: VisitorStatus.Draft,
          });
        }
      });
    },
    [dispatch, phoneUtil],
  );

  const renderStepContent = (step: number, formik: any) => {
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
                  <Autocomplete
                    open={autocompleteOpen}
                    onOpen={() => setAutocompleteOpen(true)}
                    onClose={() => setAutocompleteOpen(false)}
                    options={employees.map((e: any) => e.email).filter(Boolean)}
                    value={selectedEmail}
                    onChange={(_, v) => {
                      setSelectedEmail(v);
                      formik.setFieldValue("whoTheyMeet", v || "");
                    }}
                    inputValue={inputValue}
                    onInputChange={handleInputChange}
                    filterOptions={(x) => x}
                    isOptionEqualToValue={(a, b) => a === b}
                    getOptionLabel={(opt) => opt}
                    loading={isLoadingMore}
                    noOptionsText={
                      isLoadingMore
                        ? "Loading..."
                        : inputValue.length === 0
                          ? "Type to search employees"
                          : "No employees found"
                    }
                    ListboxComponent={CustomListbox}
                    renderOption={(props, option) => {
                      const emp = emailToEmployee[option];
                      return (
                        <li
                          {...props}
                          key={option}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                          }}
                        >
                          <Avatar
                            src={emp?.employeeThumbnail || undefined}
                            sx={{ width: 28, height: 28 }}
                          >
                            {(
                              emp?.firstName?.[0] ??
                              option[0] ??
                              "?"
                            ).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {emp
                                ? `${emp.firstName} ${emp.lastName}`
                                : option}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {option}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Whom They Meet *"
                        placeholder="Select employee…"
                        variant="outlined"
                        error={
                          formik.touched.whoTheyMeet &&
                          Boolean(formik.errors.whoTheyMeet)
                        }
                        helperText={
                          formik.touched.whoTheyMeet &&
                          formik.errors.whoTheyMeet
                        }
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: selectedEmail ? (
                            <>
                              <Avatar
                                src={
                                  emailToEmployee[selectedEmail]
                                    ?.employeeThumbnail || undefined
                                }
                                sx={{ width: 22, height: 22, mr: 1 }}
                              >
                                {(
                                  emailToEmployee[selectedEmail]
                                    ?.firstName?.[0] ??
                                  selectedEmail[0] ??
                                  "?"
                                ).toUpperCase()}
                              </Avatar>
                              {params.InputProps.startAdornment}
                            </>
                          ) : (
                            params.InputProps.startAdornment
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

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
                    onChange={(value) =>
                      formik.setFieldValue("accessibleLocations", value)
                    }
                    error={
                      formik.touched.accessibleLocations &&
                      formik.errors.accessibleLocations
                    }
                  />
                </Box>
                <Divider sx={{ my: 4 }} />
              </>
            )}

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
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Time of Entry"
                    minDateTime={dayjs()}
                    value={
                      formik.values.timeOfEntry
                        ? dayjs.utc(formik.values.timeOfEntry).local()
                        : null
                    }
                    onChange={(value) => {
                      formik.setFieldValue(
                        "timeOfEntry",
                        dayjs(value).utc().format(),
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
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Time of Departure"
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
                        dayjs(value).utc().format(),
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
                              label="Email Address *"
                              name={`visitors.${index}.emailAddress`}
                              type="email"
                              value={visitor.emailAddress}
                              onChange={formik.handleChange}
                              onBlur={() =>
                                fetchVisitorByEmail(
                                  visitor.emailAddress,
                                  index,
                                  formik,
                                )
                              }
                              error={
                                !!formik.errors.visitors?.[index]?.emailAddress
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

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="First Name *"
                              name={`visitors.${index}.firstName`}
                              value={visitor.firstName}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.visitors?.[index]?.firstName &&
                                Boolean(
                                  formik.errors.visitors?.[index]?.firstName,
                                )
                              }
                              helperText={
                                formik.touched.visitors?.[index]?.firstName &&
                                formik.errors.visitors?.[index]?.firstName
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
                              label="Last Name *"
                              name={`visitors.${index}.lastName`}
                              value={visitor.lastName}
                              onChange={formik.handleChange}
                              error={
                                formik.touched.visitors?.[index]?.lastName &&
                                Boolean(
                                  formik.errors.visitors?.[index]?.lastName,
                                )
                              }
                              helperText={
                                formik.touched.visitors?.[index]?.lastName &&
                                formik.errors.visitors?.[index]?.lastName
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
                              error={
                                formik.touched.visitors?.[index]
                                  ?.contactNumber &&
                                Boolean(
                                  formik.errors.visitors?.[index]
                                    ?.contactNumber,
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

                          {visitor.status === VisitorStatus.Draft && (
                            <Grid item xs={12} sx={{ textAlign: "right" }}>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<Check />}
                                onClick={() => formik.submitForm()}
                              >
                                Submit
                              </Button>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  ),
                )}
              </>
            )}
          </FieldArray>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Formik
          initialValues={{
            companyName: "",
            whoTheyMeet: "",
            purposeOfVisit: "",
            accessibleLocations: [],
            timeOfEntry: "",
            timeOfDeparture: "",
            visitors: [defaultVisitor],
          }}
          validationSchema={
            activeStep === 0 ? visitValidationSchema : visitorValidationSchema
          }
          onSubmit={submitVisit}
        >
          {(formik) => (
            <>
              {(visitorState.state === State.loading ||
                visitState.state === State.loading) && (
                <BackgroundLoader open message={visitorState.stateMessage} />
              )}

              <Form>
                <Stepper activeStep={activeStep}>
                  {steps.map((label) => (
                    <Step key={label}>
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
                  }}
                >
                  {isLastStep && (
                    <Button
                      onClick={() =>
                        isAnySubmittedVisitor(formik)
                          ? handleClose(formik)
                          : handleBack()
                      }
                      variant="contained"
                      sx={{ bgcolor: "grey.500", color: "white" }}
                    >
                      {isAnySubmittedVisitor(formik) ? "Close" : "Back"}
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={isLastStep && <AddIcon />}
                    disabled={
                      isLastStep
                        ? !formik.values.visitors.every(
                            (v: VisitorDetail) =>
                              v.status === VisitorStatus.Completed,
                          )
                        : false
                    }
                    onClick={async () => {
                      if (isLastStep) {
                        addNewVisitorBlock(formik);
                      } else {
                        const errors = await formik.validateForm();
                        if (Object.keys(errors).length === 0) {
                          handleNext();
                        } else {
                          formik.setTouched(
                            Object.keys(errors).reduce(
                              (acc, key) => ({ ...acc, [key]: true }),
                              {},
                            ),
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
