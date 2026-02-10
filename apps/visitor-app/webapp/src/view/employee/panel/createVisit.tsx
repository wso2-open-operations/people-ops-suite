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

import React, {
  useCallback,
  useState,
  useMemo,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import {
  Typography,
  Button,
  Box,
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
  Lock as LockIcon,
} from "@mui/icons-material";
import { FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
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
  AddVisitorPayload,
  fetchVisitor,
  resetSubmitState as resetVisitorSubmitState,
} from "@slices/visitorSlice/visitor";
import { hash } from "@root/src/utils/utils";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";
import { addVisit, AddVisitPayload } from "@root/src/slices/visitSlice/visit";
import { PhoneNumberUtil } from "google-libphonenumber";
import {
  fetchEmployees,
  loadMoreEmployees,
} from "@root/src/slices/employeeSlice/employees";

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);

enum VisitorStatus {
  Draft = "Draft",
  Existing = "Existing",
  Completed = "Completed",
}

export interface VisitorDetail {
  name?: string;
  contactNumber: string;
  countryCode: string;
  emailAddress: string;
  status: VisitorStatus;
}

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
  name: "",
  contactNumber: "",
  countryCode: "+94",
  emailAddress: "",
  status: VisitorStatus.Draft,
};

const generateTimeSlots = (startHour = 8, endHour = 23, stepMinutes = 15) => {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const hourStr = h.toString().padStart(2, "0");
      const minStr = m.toString().padStart(2, "0");
      slots.push(`${hourStr}:${minStr}`);
    }
  }
  const final = `${endHour.toString().padStart(2, "0")}:00`;
  if (!slots.includes(final)) slots.push(final);
  return slots;
};

const getDurationLabel = (
  entry: string | null,
  departure: string | null,
): string => {
  if (!entry || !departure) return "";
  const [eh, em] = entry.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const entryMinutes = eh * 60 + em;
  const depMinutes = dh * 60 + dm;
  if (depMinutes <= entryMinutes) return "";
  const diff = depMinutes - entryMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} mins`;
};

const CustomListbox = forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>((props, ref) => {
  const { children, ...other } = props;
  const { state: employeesState, isLoadingMore } = useAppSelector(
    (state: RootState) => state.employees,
  );

  return (
    <>
      {(employeesState === State.loading || isLoadingMore) && (
        <Box
          component="li"
          sx={{
            py: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1.5,
            color: "text.secondary",
          }}
        >
          <CircularProgress size={24} />
          <span>Loading employees...</span>
        </Box>
      )}
      <ul {...other} ref={ref}>
        {children}
      </ul>
    </>
  );
});

function CreateVisit() {
  const dispatch = useAppDispatch();
  const visitState = useAppSelector((state: RootState) => state.visit);
  const visitorState = useAppSelector((state: RootState) => state.visitor);
  const {
    employees,
    isLoadingMore,
    hasMore,
    currentSearchTerm,
    state: employeesState,
  } = useAppSelector((state: RootState) => state.employees);

  const dialogContext = useConfirmationModalContext();
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const visitorEmailDebounceRefs = useRef<
    Record<number, NodeJS.Timeout | null>
  >({});
  const phoneUtil = PhoneNumberUtil.getInstance();

  const [entryHour, setEntryHour] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const timeSlots = useMemo(
    () => generateTimeSlots(entryHour ?? 8, 23, 15),
    [entryHour],
  );

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 10, offset: 0 }));
  }, [dispatch]);

  const debouncedEmployeeSearch = useCallback(
    (term: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

      searchDebounceRef.current = setTimeout(() => {
        const trimmed = term.trim();
        if (trimmed !== currentSearchTerm) {
          dispatch(
            fetchEmployees({ searchTerm: trimmed, limit: 10, offset: 0 }),
          );
        }
      }, 400);
    },
    [dispatch, currentSearchTerm],
  );

  const handleListboxScroll = useCallback(
    (event: React.UIEvent<HTMLUListElement>) => {
      const node = event.currentTarget;
      if (
        node.scrollHeight - node.scrollTop - node.clientHeight < 220 &&
        !isLoadingMore &&
        hasMore &&
        employeesState !== State.loading
      ) {
        dispatch(loadMoreEmployees({ searchTerm: inputValue.trim() }));
      }
    },
    [dispatch, isLoadingMore, hasMore, inputValue, employeesState],
  );

  const addNewVisitorBlock = useCallback((formik: any) => {
    formik.setFieldValue("visitors", [
      ...formik.values.visitors,
      { ...defaultVisitor },
    ]);
  }, []);

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

          const visitUUID = uuidv4();
          const qrLink = `${window.config.AUTH_SIGN_IN_REDIRECT_URL}/admin-panel?tab=active-visits&uuid=${visitUUID}`;
          let qrCodeByteArray: number[] | undefined = undefined;

          try {
            const qrCodeBase64 = await QRCode.toDataURL(qrLink, {
              width: 300,
              margin: 2,
              color: { dark: "#000000", light: "#ffffff" },
              errorCorrectionLevel: "H",
            });
            const base64Data = qrCodeBase64.split(",")[1];
            const binaryString = window.atob(base64Data);
            qrCodeByteArray = Array.from(binaryString, (char) =>
              char.charCodeAt(0),
            );
          } catch (err) {
            console.error("QR generation failed:", err);
          }

          const visitorName = draftVisitor.name?.trim() || "";

          const addVisitorPayload: AddVisitorPayload = {
            emailHash: hashedEmail,
            email: draftVisitor.emailAddress,
            firstName: visitorName.split(" ")[0] || undefined,
            lastName: visitorName.split(" ").slice(1).join(" ") || undefined,
            contactNumber: draftVisitor.contactNumber
              ? draftVisitor.countryCode + draftVisitor.contactNumber
              : undefined,
          };

          const addVisitorAction = await dispatch(
            addVisitor(addVisitorPayload),
          );
          if (addVisitor.rejected.match(addVisitorAction)) return;
          dispatch(resetVisitorSubmitState());

          let timeOfEntryUTC: string | undefined = undefined;
          if (values.visitDate && values.timeOfEntry) {
            timeOfEntryUTC = dayjs(`${values.visitDate} ${values.timeOfEntry}`)
              .utc()
              .toISOString();
          }

          let timeOfDepartureUTC: string | undefined = undefined;
          if (values.visitDate && values.timeOfDeparture) {
            timeOfDepartureUTC = dayjs(
              `${values.visitDate} ${values.timeOfDeparture}`,
            )
              .utc()
              .toISOString();
          }

          const addVisitPayload: AddVisitPayload = {
            uuid: visitUUID,
            qrCode: qrCodeByteArray,
            visitDate: values.visitDate,
            timeOfEntry: timeOfEntryUTC,
            timeOfDeparture: timeOfDepartureUTC,
            emailHash: hashedEmail,
            whomTheyMeet: values.whoTheyMeet || undefined,
            companyName: values.companyName || undefined,
            accessibleLocations: values.accessibleLocations?.length
              ? values.accessibleLocations
              : undefined,
            purposeOfVisit: values.purposeOfVisit || undefined,
          };

          const addVisitAction = await dispatch(addVisit(addVisitPayload));

          if (addVisit.fulfilled.match(addVisitAction)) {
            setFieldValue(`visitors.${index}.status`, VisitorStatus.Completed);
          }
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
      const emailHash = await hash(email);
      const action = await dispatch(fetchVisitor(emailHash));
      if (fetchVisitor.fulfilled.match(action)) {
        let countryCode = "+94";
        let nationalNumber = "";
        const raw = action.payload.contactNumber;
        if (raw) {
          try {
            const parsed = phoneUtil.parseAndKeepRawInput(raw);
            const cc = parsed.getCountryCode();
            countryCode = cc ? `+${cc}` : "+94";
            nationalNumber = parsed.getNationalNumber()?.toString() || "";
          } catch (err) {
            console.warn("Phone parse failed:", raw);
          }
        }
        const fetched: VisitorDetail = {
          name: `${action.payload.firstName || ""} ${action.payload.lastName || ""}`.trim(),
          contactNumber: nationalNumber,
          countryCode,
          emailAddress: action.payload.email || email,
          status: VisitorStatus.Draft,
        };
        formik.setFieldValue(`visitors.${index}`, fetched);
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

  const canAddMoreVisitors = useCallback(
    (formik: any) => {
      if (formik.values.visitors.length === 0) return false;
      const lastVisitor =
        formik.values.visitors[formik.values.visitors.length - 1];
      return (
        isAnySubmittedVisitor(formik) &&
        lastVisitor.status !== VisitorStatus.Draft
      );
    },
    [isAnySubmittedVisitor],
  );

  const validationSchema = Yup.object().shape({
    companyName: Yup.string().nullable(),
    whoTheyMeet: Yup.string().nullable(),
    whoTheyMeetName: Yup.string().nullable(),
    whomTheyMeetThumbnail: Yup.string().nullable(),
    purposeOfVisit: Yup.string().nullable(),
    accessibleLocations: Yup.array().nullable(),
    visitDate: Yup.string()
      .required("Visit date is required")
      .test(
        "future-or-today",
        "Visit date cannot be in the past",
        (value) => !value || dayjs(value).isSameOrAfter(dayjs(), "day"),
      ),
    timeOfEntry: Yup.string()
      .nullable()
      .test("future-or-now", "Cannot be in the past", function (value) {
        const { visitDate } = this.parent;
        if (!visitDate || !value) return true;
        return dayjs(`${visitDate} ${value}`).isAfter(
          dayjs().subtract(1, "minute"),
        );
      }),
    timeOfDeparture: Yup.string()
      .nullable()
      .test("after-entry", "Must be after entry", function (value) {
        const { visitDate, timeOfEntry } = this.parent;
        if (!visitDate || !value || !timeOfEntry) return true;
        return dayjs(`${visitDate} ${value}`).isAfter(
          dayjs(`${visitDate} ${timeOfEntry}`),
        );
      }),
    visitors: Yup.array().of(
      Yup.object({
        firstName: Yup.string().nullable(),
        lastName: Yup.string().nullable(),
        emailAddress: Yup.string()
          .email("Invalid email")
          .required("Email is required")
          .test("unique-email", "Email must be unique", function (value) {
            const visitors = this.options.context?.visitors || [];
            return (
              !value ||
              visitors.filter((v: any) => v.emailAddress === value).length === 1
            );
          }),
        contactNumber: Yup.string()
          .matches(/^\d{6,15}$/, "Invalid phone number (6-15 digits)")
          .nullable(),
      }),
    ),
  });

  const formikRef = useRef<any>(null);

  const renderVisitDetails = (formik: any) => {
    formikRef.current = formik;

    const locked = isAnySubmittedVisitor(formik);

    return (
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Typography variant="h5">Visit Information</Typography>
          {locked && (
            <Box
              sx={{ display: "flex", alignItems: "center", color: "grey.700" }}
            >
              <LockIcon fontSize="small" sx={{ mr: 0.5 }} />
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              open={open && !locked}
              onOpen={() => !locked && setOpen(true)}
              onClose={() => setOpen(false)}
              disablePortal
              options={employees}
              getOptionLabel={(option) => {
                if (typeof option === "string") {
                  return formik.values.whoTheyMeetName || option;
                }
                return `${option?.firstName || ""} ${option?.lastName || ""}`.trim();
              }}
              value={formik.values.whoTheyMeet || null}
              onChange={(_, newValue) => {
                if (locked) return;

                if (newValue === null) {
                  formik.setFieldValue("whoTheyMeet", "");
                  formik.setFieldValue("whoTheyMeetName", "");
                  formik.setFieldValue("whomTheyMeetThumbnail", null);
                  return;
                }

                if (typeof newValue === "object" && newValue !== null) {
                  const fullName =
                    `${newValue.firstName || ""} ${newValue.lastName || ""}`.trim();
                  formik.setFieldValue("whoTheyMeet", newValue.workEmail || ""); // email for payload
                  formik.setFieldValue("whoTheyMeetName", fullName); // name for display
                  formik.setFieldValue(
                    "whomTheyMeetThumbnail",
                    newValue.employeeThumbnail || null,
                  );
                }
              }}
              inputValue={inputValue}
              onInputChange={(event, newInputValue, reason) => {
                setInputValue(newInputValue);

                if (reason === "input") {
                  formikRef.current?.setFieldValue(
                    "whomTheyMeetThumbnail",
                    null,
                  );
                }

                if (reason === "reset") return;

                const trimmed = newInputValue.trim();

                if (trimmed.length === 0) {
                  debouncedEmployeeSearch("");
                } else if (trimmed.length >= 2) {
                  debouncedEmployeeSearch(trimmed);
                }
              }}
              filterOptions={(x) => x}
              loading={employeesState === State.loading || isLoadingMore}
              autoHighlight
              disabled={locked}
              ListboxComponent={CustomListbox}
              ListboxProps={{ onScroll: handleListboxScroll }}
              noOptionsText={
                inputValue.trim().length < 2
                  ? "Type at least 2 characters to search employees"
                  : employeesState === State.loading
                    ? "Searching..."
                    : "No employees found"
              }
              renderOption={(props, employee) => (
                <li
                  {...props}
                  key={employee.email}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <Avatar
                    src={employee.employeeThumbnail}
                    sx={{ width: 32, height: 32 }}
                  >
                    {employee.firstName?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" noWrap>
                      {`${employee.firstName} ${employee.lastName}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {employee.workEmail}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => {
                const thumbnail = formik.values.whomTheyMeetThumbnail;

                let initial = "?";
                if (formik.values.whoTheyMeetName) {
                  initial = formik.values.whoTheyMeetName
                    .charAt(0)
                    .toUpperCase();
                } else if (formik.values.whoTheyMeet) {
                  initial = formik.values.whoTheyMeet.charAt(0).toUpperCase();
                }

                return (
                  <TextField
                    {...params}
                    label="Whom They Meet"
                    placeholder="Search by name or email..."
                    disabled={locked}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          {formik.values.whoTheyMeet && (
                            <InputAdornment position="start" sx={{ ml: 0.5 }}>
                              <Avatar
                                src={thumbnail ?? undefined}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: "0.95rem",
                                  bgcolor: thumbnail
                                    ? "transparent"
                                    : "primary.main",
                                }}
                              >
                                {!thumbnail && initial}
                              </Avatar>
                            </InputAdornment>
                          )}
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {(employeesState === State.loading ||
                            isLoadingMore) && (
                            <InputAdornment position="end" sx={{ mr: 1 }}>
                              <CircularProgress size={18} />
                            </InputAdornment>
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    error={
                      formik.touched.whoTheyMeet &&
                      Boolean(formik.errors.whoTheyMeet)
                    }
                    helperText={
                      formik.touched.whoTheyMeet && formik.errors.whoTheyMeet
                    }
                  />
                );
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              label="Purpose of Visit"
              name="purposeOfVisit"
              value={formik.values.purposeOfVisit || ""}
              onChange={formik.handleChange}
              disabled={locked}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <BusinessIcon fontSize="small" color="primary" />
          Accessible Floors & Rooms
          {locked && <LockIcon fontSize="small" color="action" />}
        </Typography>

        <FloorRoomSelector
          availableFloorsAndRooms={AVAILABLE_FLOORS_AND_ROOMS}
          selectedFloorsAndRooms={formik.values.accessibleLocations}
          onChange={(val) =>
            !locked && formik.setFieldValue("accessibleLocations", val)
          }
          disabled={locked}
        />

        <Divider sx={{ my: 4 }} />

        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
        >
          <ScheduleIcon fontSize="small" color="primary" />
          Schedule
          {locked && <LockIcon fontSize="small" color="action" />}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="Visit Date"
              minDate={dayjs().startOf("day")}
              value={
                formik.values.visitDate ? dayjs(formik.values.visitDate) : null
              }
              onChange={(val) =>
                !locked &&
                formik.setFieldValue(
                  "visitDate",
                  val ? val.format("YYYY-MM-DD") : "",
                )
              }
              disabled={locked}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error:
                    formik.touched.visitDate &&
                    Boolean(formik.errors.visitDate),
                  helperText:
                    formik.touched.visitDate && formik.errors.visitDate,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TimePicker
              label="Expected Entry Time"
              ampm={false}
              value={
                formik.values.visitDate && formik.values.timeOfEntry
                  ? dayjs(
                      `${formik.values.visitDate} ${formik.values.timeOfEntry}`,
                    )
                  : null
              }
              onChange={(val) => {
                if (locked) return;
                if (!val) {
                  formik.setFieldValue("timeOfEntry", "");
                  setEntryHour(null);
                  return;
                }
                const fmt = val.format("HH:mm");
                formik.setFieldValue("timeOfEntry", fmt);
                setEntryHour(Number(fmt.split(":")[0]));
                formik.setFieldValue("timeOfDeparture", "");
              }}
              disabled={locked || !formik.values.visitDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error:
                    formik.touched.timeOfEntry &&
                    Boolean(formik.errors.timeOfEntry),
                  helperText:
                    formik.touched.timeOfEntry && formik.errors.timeOfEntry,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              options={
                formik.values.timeOfEntry
                  ? timeSlots.filter((t) => t > formik.values.timeOfEntry)
                  : timeSlots
              }
              value={formik.values.timeOfDeparture || null}
              onChange={(_, val) =>
                !locked && formik.setFieldValue("timeOfDeparture", val || "")
              }
              disabled={locked || !formik.values.timeOfEntry}
              getOptionLabel={(opt) => {
                const dur = getDurationLabel(formik.values.timeOfEntry, opt);
                return dur ? `${opt}  (${dur})` : opt;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Expected Departure Time"
                  fullWidth
                  disabled={locked}
                  error={
                    formik.touched.timeOfDeparture &&
                    Boolean(formik.errors.timeOfDeparture)
                  }
                  helperText={
                    formik.touched.timeOfDeparture &&
                    formik.errors.timeOfDeparture
                  }
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderVisitors = (formik: any) => (
    <FieldArray name="visitors">
      {({ remove }) => (
        <div>
          {formik.values.visitors.map((visitor: VisitorDetail, idx: number) => (
            <Card key={idx} variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <PersonIcon color="primary" />
                    Visitor {idx + 1}
                    {visitor.status === VisitorStatus.Completed && (
                      <LockIcon fontSize="small" color="action" />
                    )}
                  </Typography>

                  {formik.values.visitors.length > 1 &&
                    visitor.status === VisitorStatus.Draft && (
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => remove(idx)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Email Address"
                      name={`visitors.${idx}.emailAddress`}
                      value={visitor.emailAddress}
                      onChange={(e) => {
                        formik.handleChange(e);
                        const email = e.target.value.trim();

                        if (visitorEmailDebounceRefs.current[idx]) {
                          clearTimeout(visitorEmailDebounceRefs.current[idx]!);
                        }

                        visitorEmailDebounceRefs.current[idx] = setTimeout(
                          () => {
                            if (
                              visitor.status === VisitorStatus.Draft &&
                              email &&
                              email.includes("@") &&
                              email.length >= 6
                            ) {
                              fetchVisitorByEmail(email, idx, formik);
                            }
                            delete visitorEmailDebounceRefs.current[idx];
                          },
                          600,
                        );
                      }}
                      disabled={visitor.status === VisitorStatus.Completed}
                      error={
                        formik.touched.visitors?.[idx]?.emailAddress &&
                        Boolean(formik.errors.visitors?.[idx]?.emailAddress)
                      }
                      helperText={
                        formik.touched.visitors?.[idx]?.emailAddress &&
                        formik.errors.visitors?.[idx]?.emailAddress
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      name={`visitors.${idx}.contactNumber`}
                      value={visitor.contactNumber}
                      onChange={formik.handleChange}
                      disabled={visitor.status === VisitorStatus.Completed}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TextField
                              select
                              variant="standard"
                              name={`visitors.${idx}.countryCode`}
                              value={visitor.countryCode}
                              onChange={formik.handleChange}
                              disabled={
                                visitor.status === VisitorStatus.Completed
                              }
                              sx={{ minWidth: 80, mr: 1 }}
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
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="First Name & Last Name"
                      name={`visitors.${idx}.name`}
                      value={visitor.name}
                      onChange={formik.handleChange}
                      disabled={visitor.status === VisitorStatus.Completed}
                    />
                  </Grid>

                  {visitor.status === VisitorStatus.Draft && (
                    <Grid item xs={12} sx={{ textAlign: "right" }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        disabled={formik.isSubmitting}
                      >
                        Submit Visitor
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </FieldArray>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Formik
        initialValues={{
          companyName: "",
          whoTheyMeet: "",
          whoTheyMeetName: "",
          whomTheyMeetThumbnail: null as string | null,
          purposeOfVisit: "",
          accessibleLocations: [],
          visitDate: "",
          timeOfEntry: "",
          timeOfDeparture: "",
          visitors: [defaultVisitor],
        }}
        validationSchema={validationSchema}
        onSubmit={submitVisit}
        validateOnMount={false}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {(formik) => {
          const hasSubmitted = isAnySubmittedVisitor(formik);
          const canAddMore = canAddMoreVisitors(formik);

          return (
            <>
              {(visitorState.state === State.loading ||
                visitState.submitState === State.loading) && (
                <BackgroundLoader
                  open
                  message={
                    visitorState.state === State.loading
                      ? visitorState.stateMessage || "Processing visitor..."
                      : visitState.stateMessage || "Creating visit..."
                  }
                />
              )}

              <Form noValidate>
                {renderVisitDetails(formik)}

                <Divider sx={{ my: 5 }} />

                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  Visitors
                </Typography>

                {renderVisitors(formik)}

                <Box
                  sx={{
                    mt: 5,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addNewVisitorBlock(formik)}
                    disabled={!canAddMore}
                  >
                    Add Another Visitor
                  </Button>
                </Box>

                {hasSubmitted && (
                  <Box sx={{ mt: 5, textAlign: "center" }}>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={() =>
                        dialogContext.showConfirmation(
                          "Finish this visit?",
                          "Visit details are already locked. No more changes allowed.",
                          ConfirmationType.accept,
                          () => formik.resetForm(),
                          "Yes, Finish",
                          "Cancel",
                        )
                      }
                    >
                      Finish & Close Visit
                    </Button>
                  </Box>
                )}
              </Form>
            </>
          );
        }}
      </Formik>
    </Container>
  );
}

export default CreateVisit;
