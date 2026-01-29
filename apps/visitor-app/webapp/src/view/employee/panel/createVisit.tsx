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
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Check as CheckIcon,
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
  const visitorState = useAppSelector((state: RootState) => state.visitor);
  const { employees, isLoadingMore, hasMore, currentSearchTerm } =
    useAppSelector((state: RootState) => state.employees);

  const dialogContext = useConfirmationModalContext();
  const phoneUtil = PhoneNumberUtil.getInstance();

  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === steps.length - 1;

  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const emailToEmployee = useMemo(() => {
    const map: Record<string, any> = {};
    employees.forEach((emp) => {
      if (emp?.workEmail) {
        map[emp.workEmail.toLowerCase()] = emp;
      }
    });
    return map;
  }, [employees]);

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
        node.scrollHeight - node.scrollTop - node.clientHeight < 180 &&
        !isLoadingMore &&
        hasMore
      ) {
        dispatch(loadMoreEmployees({ searchTerm: inputValue.trim() }));
      }
    },
    [dispatch, isLoadingMore, hasMore, inputValue],
  );

  const CustomListbox = forwardRef<HTMLUListElement, any>((props, ref) => (
    <ul {...props} ref={ref} onScroll={handleScroll} />
  ));

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
    async (values: any, { setFieldValue }: any) => {
      const draftVisitor = values.visitors.find(
        (v: VisitorDetail) => v.status === VisitorStatus.Draft,
      );
      if (!draftVisitor) return;

      const index = values.visitors.indexOf(draftVisitor);

      dialogContext.showConfirmation(
        "Do you want to submit this visitor?",
        "Please note, this will add the visitor's information to the system.",
        ConfirmationType.accept,
        async () => {
          const hashedEmail = await hash(draftVisitor.emailAddress);

          const addVisitorAction = await dispatch(
            addVisitor({
              firstName: draftVisitor.firstName,
              lastName: draftVisitor.lastName,
              email: hashedEmail,
            }),
          );

          if (addVisitor.fulfilled.match(addVisitorAction)) {
            setFieldValue(`visitors.${index}.status`, VisitorStatus.Completed);
          }

          dispatch(resetVisitorSubmitState());

          await dispatch(
            addVisit({
              companyName: values.companyName,
              whomTheyMeet: values.whoTheyMeet,
              purposeOfVisit: values.purposeOfVisit,
              accessibleLocations: values.accessibleLocations,
              timeOfEntry: values.timeOfEntry
                ? dayjs(values.timeOfEntry).utc().format("YYYY-MM-DDTHH:mm:ss")
                : "",
              timeOfDeparture: values.timeOfDeparture
                ? dayjs(values.timeOfDeparture)
                    .utc()
                    .format("YYYY-MM-DDTHH:mm:ss")
                : "",
            }),
          );
        },
        "Yes",
        "Cancel",
      );
    },
    [dispatch, dialogContext],
  );

  const fetchVisitorByEmail = useCallback(
    async (email: string, index: number, formik: any) => {
      if (!email?.trim()) return;
      const hashed = await hash(email);
      const action = await dispatch(fetchVisitor(hashed));
      if (fetchVisitor.fulfilled.match(action)) {
        const p = action.payload;
        let countryCode = "+94";
        let nationalNumber = "";

        try {
          const phone = phoneUtil.parseAndKeepRawInput(p.contactNumber || "");
          if (phoneUtil.isValidNumber(phone)) {
            countryCode = `+${phone.getCountryCode() || 94}`;
            nationalNumber = phone.getNationalNumber()?.toString() || "";
          }
        } catch {}

        formik.setFieldValue(`visitors.${index}`, {
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          contactNumber: nationalNumber,
          countryCode,
          emailAddress: email,
          status: VisitorStatus.Draft,
        });
      }
    },
    [dispatch, phoneUtil],
  );

  const isAnySubmittedVisitor = useCallback(
    (formik: any) =>
      formik.values.visitors.some(
        (v: VisitorDetail) => v.status === VisitorStatus.Completed,
      ),
    [],
  );

  const visitValidationSchema = Yup.object().shape({
    whoTheyMeet: Yup.string().required("Required"),
    purposeOfVisit: Yup.string().required("Required"),
    accessibleLocations: Yup.array().when([], {
      is: () => authState.roles.includes(Role.ADMIN),
      then: (s) => s.min(1, "Select at least one location"),
      otherwise: (s) => s,
    }),
    timeOfEntry: Yup.string().test(
      "future-or-now",
      "Cannot be in the past",
      (v) => !v || dayjs(v).isAfter(dayjs().subtract(1, "minute")),
    ),
    timeOfDeparture: Yup.string().test(
      "after-entry",
      "Departure must be after entry",
      function (v) {
        const entry = this.parent.timeOfEntry;
        return !v || !entry || dayjs(v).isAfter(dayjs(entry));
      },
    ),
  });

  const visitorValidationSchema = Yup.object().shape({
    visitors: Yup.array().of(
      Yup.object({
        firstName: Yup.string().required("Required"),
        lastName: Yup.string().required("Required"),
        emailAddress: Yup.string()
          .email("Invalid email")
          .required("Required")
          .test("unique", "Duplicate email", function (value) {
            const visitors = this.options.context?.visitors || [];
            return (
              !value ||
              visitors.filter((v: any) => v.emailAddress === value).length === 1
            );
          }),
        contactNumber: Yup.string()
          .matches(/^\d{6,15}$/, "Invalid number")
          .nullable(),
      }),
    ),
  });

  const renderStepContent = (step: number, formik: any) => {
    switch (step) {
      case 0:
        return (
          <>
            <Box sx={{ mb: 5 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}
              >
                <BusinessIcon color="primary" /> Visit Details
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
                    open={open}
                    onOpen={() => setOpen(true)}
                    onClose={() => setOpen(false)}
                    disablePortal
                    options={employees.map((emp) => emp.workEmail)}
                    value={formik.values.whoTheyMeet || null}
                    onChange={(_, val) =>
                      formik.setFieldValue("whoTheyMeet", val || "")
                    }
                    inputValue={inputValue}
                    onInputChange={handleInputChange}
                    filterOptions={(x) => x}
                    loading={isLoadingMore}
                    autoHighlight
                    noOptionsText={
                      isLoadingMore
                        ? "Loading employees..."
                        : inputValue.trim()
                          ? "No matching employees"
                          : "Type name or email to search"
                    }
                    ListboxComponent={CustomListbox}
                    isOptionEqualToValue={(option, value) => option === value}
                    getOptionLabel={(option) => option}
                    renderOption={(props, emailOpt) => {
                      const emp = emailToEmployee[emailOpt.toLowerCase()];
                      const displayName = emp
                        ? `${emp.firstName} ${emp.lastName}`
                        : emailOpt;

                      return (
                        <li
                          {...props}
                          key={emailOpt}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "8px 16px",
                          }}
                        >
                          <Avatar
                            src={emp?.employeeThumbnail}
                            sx={{ width: 32, height: 32 }}
                          >
                            {displayName.charAt(0).toUpperCase() || "?"}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {displayName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {emailOpt}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                    renderInput={(params) => {
                      const selectedEmp = formik.values.whoTheyMeet
                        ? emailToEmployee[
                            formik.values.whoTheyMeet.toLowerCase()
                          ]
                        : null;

                      return (
                        <TextField
                          {...params}
                          label="Whom They Meet *"
                          placeholder="Search name or email"
                          error={
                            formik.touched.whoTheyMeet &&
                            !!formik.errors.whoTheyMeet
                          }
                          helperText={
                            formik.touched.whoTheyMeet &&
                            formik.errors.whoTheyMeet
                          }
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: selectedEmp ? (
                              <>
                                <Avatar
                                  src={selectedEmp.employeeThumbnail}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    mr: 1.5,
                                    ml: 0.5,
                                  }}
                                >
                                  {selectedEmp.firstName
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </Avatar>
                                {params.InputProps.startAdornment}
                              </>
                            ) : (
                              params.InputProps.startAdornment
                            ),
                            endAdornment: (
                              <>
                                {isLoadingMore && (
                                  <CircularProgress size={20} sx={{ mr: 2 }} />
                                )}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      );
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    name="purposeOfVisit"
                    label="Purpose of Visit / Comments *"
                    value={formik.values.purposeOfVisit}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.purposeOfVisit &&
                      !!formik.errors.purposeOfVisit
                    }
                    helperText={
                      formik.touched.purposeOfVisit &&
                      formik.errors.purposeOfVisit
                    }
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {authState.roles.includes(Role.ADMIN) && (
              <>
                <Box sx={{ mb: 5 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                  >
                    <BusinessIcon color="primary" /> Accessible Floors & Rooms *
                  </Typography>
                  <FloorRoomSelector
                    availableFloorsAndRooms={AVAILABLE_FLOORS_AND_ROOMS}
                    selectedFloorsAndRooms={formik.values.accessibleLocations}
                    onChange={(val) =>
                      formik.setFieldValue("accessibleLocations", val)
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
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}
              >
                <ScheduleIcon color="primary" /> Schedule
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Expected Time of Entry"
                    minDateTime={dayjs()}
                    value={
                      formik.values.timeOfEntry
                        ? dayjs(formik.values.timeOfEntry)
                        : null
                    }
                    onChange={(newValue) =>
                      formik.setFieldValue(
                        "timeOfEntry",
                        newValue ? dayjs(newValue).utc().format() : "",
                      )
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error:
                          formik.touched.timeOfEntry &&
                          !!formik.errors.timeOfEntry,
                        helperText:
                          formik.touched.timeOfEntry &&
                          formik.errors.timeOfEntry,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Expected Time of Departure"
                    minDateTime={
                      formik.values.timeOfEntry
                        ? dayjs(formik.values.timeOfEntry)
                        : dayjs()
                    }
                    value={
                      formik.values.timeOfDeparture
                        ? dayjs(formik.values.timeOfDeparture)
                        : null
                    }
                    onChange={(newValue) =>
                      formik.setFieldValue(
                        "timeOfDeparture",
                        newValue ? dayjs(newValue).utc().format() : "",
                      )
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error:
                          formik.touched.timeOfDeparture &&
                          !!formik.errors.timeOfDeparture,
                        helperText:
                          formik.touched.timeOfDeparture &&
                          formik.errors.timeOfDeparture,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        );

      case 1:
        return (
          <FieldArray name="visitors">
            {({ remove }) => (
              <>
                {formik.values.visitors.map(
                  (visitor: VisitorDetail, index: number) => (
                    <Card key={index} variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <PersonIcon color="primary" /> Visitor {index + 1}
                          </Typography>
                          {formik.values.visitors.length > 1 &&
                            visitor.status === VisitorStatus.Draft && (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => remove(index)}
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
                                !!formik.errors.visitors?.[index]?.firstName
                              }
                              helperText={
                                formik.touched.visitors?.[index]?.firstName &&
                                formik.errors.visitors?.[index]?.firstName
                              }
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
                                !!formik.errors.visitors?.[index]?.lastName
                              }
                              helperText={
                                formik.touched.visitors?.[index]?.lastName &&
                                formik.errors.visitors?.[index]?.lastName
                              }
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
                                !!formik.errors.visitors?.[index]?.contactNumber
                              }
                              helperText={
                                formik.touched.visitors?.[index]
                                  ?.contactNumber &&
                                formik.errors.visitors?.[index]?.contactNumber
                              }
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
                                      {COUNTRY_CODES.map((c) => (
                                        <MenuItem key={c.code} value={c.code}>
                                          {c.flag} {c.code}
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
                            <Grid
                              item
                              xs={12}
                              sx={{ textAlign: "right", mt: 2 }}
                            >
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => formik.submitForm()}
                              >
                                Submit Visitor
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
              <BackgroundLoader
                open
                message={visitorState.stateMessage || "Processing..."}
              />
            )}

            <Form noValidate>
              <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ minHeight: "50vh" }}>
                {renderStepContent(activeStep, formik)}
              </Box>

              <Box
                sx={{
                  mt: 5,
                  display: "flex",
                  justifyContent:
                    activeStep === 0 ? "flex-end" : "space-between",
                  gap: 2,
                }}
              >
                {activeStep === 1 && (
                  <Button
                    variant="outlined"
                    color={isAnySubmittedVisitor(formik) ? "error" : "inherit"}
                    onClick={() =>
                      isAnySubmittedVisitor(formik)
                        ? handleClose(formik)
                        : handleBack()
                    }
                  >
                    {isAnySubmittedVisitor(formik) ? "Close Visit" : "Back"}
                  </Button>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={isLastStep ? <AddIcon /> : null}
                  disabled={
                    isLastStep &&
                    !formik.values.visitors.every(
                      (v: VisitorDetail) =>
                        v.status === VisitorStatus.Completed,
                    )
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
                          Object.fromEntries(
                            Object.keys(errors).map((key) => [key, true]),
                          ),
                        );
                      }
                    }
                  }}
                >
                  {isLastStep ? "Add Another Visitor" : "Continue"}
                </Button>
              </Box>
            </Form>
          </>
        )}
      </Formik>
    </Container>
  );
}

export default CreateVisit;
