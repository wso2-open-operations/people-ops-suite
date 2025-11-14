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

import React, { useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import { useFormikContext } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchEmployeesBasicInfo,
  resetEmployee,
  fetchContinuousServiceRecord,
  resetSubmitState,
} from "@slices/employeeSlice/employee";
import {
  fetchBusinessUnits,
  fetchTeams,
  fetchSubTeams,
  fetchUnits,
  fetchCareerFunctions,
  fetchDesignations,
  fetchOffices,
} from "@slices/organizationSlice/organization";
import { EmployeeTypes } from "@root/src/config/constant";
import { CreateEmployeeFormValues } from "@root/src/types/types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  BadgeOutlined,
  WorkOutline,
  LocationOnOutlined,
  EventOutlined,
  SupervisorAccountOutlined,
  PhoneOutlined,
} from "@mui/icons-material";
import dayjs from "dayjs";
import debounce from "lodash/debounce";

export const jobInfoValidationSchema = Yup.object().shape({
  workEmail: Yup.string()
    .required("Work email is required")
    .email("Invalid email format")
    .max(254, "Email must be at most 254 characters"),
  epf: Yup.string()
    .max(45, "EPF must be at most 45 characters")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  businessUnitId: Yup.number()
    .required("Business unit is required")
    .min(1, "Select a valid business unit"),
  teamId: Yup.number()
    .required("Team is required")
    .min(1, "Select a valid team"),
  subTeamId: Yup.number()
    .required("Sub Team is required")
    .min(1, "Select a valid sub team"),
  unitId: Yup.number()
    .transform((value) => (value === 0 ? null : value))
    .nullable(),
  careerFunctionId: Yup.number()
    .required("Career function is required")
    .min(1, "Select a valid career function"),
  designationId: Yup.number()
    .required("Designation is required")
    .min(1, "Select a valid designation"),
  officeId: Yup.number()
    .required("Office is required")
    .min(1, "Select a valid office"),
  employmentLocation: Yup.string().required("Employment location is required"),
  workLocation: Yup.string().required("Work location is required"),
  startDate: Yup.string().required("Start date is required"),
  probationEndDate: Yup.string()
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  agreementEndDate: Yup.string()
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  managerEmail: Yup.string().required("Manager email is required"),
  additionalManagerEmail: Yup.array()
    .of(Yup.string().email("Invalid email format"))
    .nullable(),
  workPhoneNumber: Yup.string()
    .matches(/^[0-9+\-()\s]{6,20}$/, "Invalid phone format")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});

const SectionHeader = React.memo(
  ({ icon, title, headerBoxSx, iconBoxSx }: any) => {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          ...headerBoxSx,
        }}
      >
        <Box sx={iconBoxSx}>{icon}</Box>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>
    );
  }
);

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

export default function JobInfoStep() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { values, handleChange, handleBlur, touched, errors, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();
  const { employeesBasicInfo, state, continuousServiceRecord, errorMessage } =
    useAppSelector((s) => s.employee);
  const {
    businessUnits,
    teams,
    subTeams,
    units,
    careerFunctions,
    designations,
    offices,
  } = useAppSelector((state) => state.organization);

  const textFieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        "&:not(.Mui-disabled):hover fieldset": {
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

  const headerBoxSx = useMemo(
    () => ({ display: "flex", alignItems: "center", gap: 1.5, mb: 3, mt: 4 }),
    []
  );

  const iconBoxSx = useMemo(
    () => ({
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
    }),
    [theme]
  );

  const disabledSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root.Mui-disabled": {
        backgroundColor: alpha(theme.palette.action.disabledBackground, 0.05),
      },
    }),
    [theme]
  );

  const icons = useMemo(
    () => ({
      badge: <BadgeOutlined />,
      work: <WorkOutline />,
      location: <LocationOnOutlined />,
      event: <EventOutlined />,
      supervisor: <SupervisorAccountOutlined />,
      phone: <PhoneOutlined />,
    }),
    []
  );

  const FULL_TIME_ID = EmployeeTypes.find(
    (type) => type.label === "Full-time"
  )?.id;

  const INTERN_ID = EmployeeTypes.find((type) => type.label === "Intern")?.id;

  const CONSULTANCY_ID = EmployeeTypes.find(
    (type) => type.label === "Consultancy"
  )?.id;

  // Determine if date fields should be disabled based on employment type
  const isProbationEndDateDisabled = useMemo(() => {
    return (
      !values.employmentTypeId ||
      values.employmentTypeId === INTERN_ID ||
      values.employmentTypeId === CONSULTANCY_ID
    );
  }, [values.employmentTypeId, INTERN_ID, CONSULTANCY_ID]);

  const isAgreementEndDateDisabled = useMemo(() => {
    return !values.employmentTypeId || values.employmentTypeId === FULL_TIME_ID;
  }, [values.employmentTypeId, FULL_TIME_ID]);

  // Reset probation and agreement end dates when they are disabled
  useEffect(() => {
    if (isProbationEndDateDisabled) {
      setFieldValue("probationEndDate", null);
    }
    if (isAgreementEndDateDisabled) {
      setFieldValue("agreementEndDate", null);
    }
  }, [isProbationEndDateDisabled, isAgreementEndDateDisabled, setFieldValue]);

  // Fetch required master data on mount and reset employee slice on unmount
  useEffect(() => {
    dispatch(fetchBusinessUnits());
    dispatch(fetchOffices());
    dispatch(fetchCareerFunctions());
    dispatch(fetchEmployeesBasicInfo());
    return () => {
      dispatch(resetEmployee());
    };
  }, [dispatch]);

  // Update employmentLocation automatically based on selected office
  const prevBusinessUnitId = React.useRef(values.businessUnitId);
  useEffect(() => {
    if (values.businessUnitId) {
      dispatch(fetchTeams({ id: values.businessUnitId }));

      if (prevBusinessUnitId.current !== values.businessUnitId) {
        setFieldValue("teamId", 0);
        setFieldValue("subTeamId", 0);
        setFieldValue("unitId", 0);
      }
      prevBusinessUnitId.current = values.businessUnitId;
    } else {
      setFieldValue("teamId", 0);
      setFieldValue("subTeamId", 0);
      setFieldValue("unitId", 0);
    }
  }, [values.businessUnitId, dispatch, setFieldValue]);

  const prevTeamId = React.useRef(values.teamId);

  useEffect(() => {
    if (values.teamId) {
      dispatch(fetchSubTeams({ id: values.teamId }));

      if (prevTeamId.current !== values.teamId) {
        setFieldValue("subTeamId", 0);
        setFieldValue("unitId", 0);
      }

      prevTeamId.current = values.teamId;
    } else {
      setFieldValue("subTeamId", 0);
      setFieldValue("unitId", 0);
    }
  }, [values.teamId, dispatch, setFieldValue]);

  const prevSubTeamId = React.useRef(values.subTeamId);

  useEffect(() => {
    if (values.subTeamId) {
      dispatch(fetchUnits({ id: values.subTeamId }));

      if (prevSubTeamId.current !== values.subTeamId) {
        setFieldValue("unitId", 0);
      }

      prevSubTeamId.current = values.subTeamId;
    } else {
      setFieldValue("unitId", 0);
    }
  }, [values.subTeamId, dispatch, setFieldValue]);

  // Update employmentLocation automatically based on selected office
  useEffect(() => {
    const selectedOffice = offices.find(
      (office) => office.id === values.officeId
    );
    if (selectedOffice) {
      setFieldValue("employmentLocation", selectedOffice.location);
      if (
        values.workLocation &&
        !selectedOffice.workingLocations.includes(values.workLocation)
      ) {
        setFieldValue("workLocation", "");
      }
    } else {
      setFieldValue("employmentLocation", "");
      setFieldValue("workLocation", "");
    }
  }, [values.officeId, offices, setFieldValue, values.workLocation]);

  const debouncedFetchContinuousServiceRecord = useMemo(
    () =>
      debounce((email: string) => {
        if (email && Yup.string().email().isValidSync(email)) {
          dispatch(fetchContinuousServiceRecord(email));
        }
      }, 500),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetchContinuousServiceRecord(values.workEmail);
    if (!values.workEmail) {
      dispatch(resetSubmitState());
      dispatch(resetEmployee());
    }
  }, [values.workEmail, debouncedFetchContinuousServiceRecord, dispatch]);

  useEffect(() => {
    return () => {
      debouncedFetchContinuousServiceRecord.cancel();
    };
  }, [debouncedFetchContinuousServiceRecord]);

  const renderField = useCallback(
    (name: keyof CreateEmployeeFormValues, label: string, required = true) => {
      const error = Boolean(touched[name] && errors[name]);
      const helperText = (touched[name] && errors[name]) || "";
      return (
        <MemoizedTextField
          name={name}
          label={label}
          required={required}
          value={values[name] ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={error}
          helperText={helperText}
          textFieldSx={textFieldSx}
        />
      );
    },
    [values, handleChange, handleBlur, touched, errors, textFieldSx]
  );

  return (
    <Box sx={{ width: "100%", px: 0 }}>
      <Box>
        <SectionHeader
          icon={icons.badge}
          title="Identity"
          headerBoxSx={headerBoxSx}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("workEmail", "Work Email")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip
              title={
                continuousServiceRecord && !errorMessage ? (
                  <Box sx={{ p: 1, maxWidth: 300 }}>
                    <Typography variant="caption" fontWeight={600}>
                      Continuous Service Record
                    </Typography>
                    {[
                      {
                        label: "Employee ID",
                        value: continuousServiceRecord.employeeId,
                      },
                      {
                        label: "Name",
                        value: `${continuousServiceRecord.firstName} ${continuousServiceRecord.lastName}`,
                      },
                      {
                        label: "Designation",
                        value: continuousServiceRecord.designation,
                      },
                      {
                        label: "Employment Location",
                        value: continuousServiceRecord.employmentLocation,
                      },
                      {
                        label: "Work Location",
                        value: continuousServiceRecord.workLocation,
                      },
                      {
                        label: "Start Date",
                        value: dayjs(continuousServiceRecord.startDate).format(
                          "YYYY-MM-DD"
                        ),
                      },
                      {
                        label: "Manager Email",
                        value: continuousServiceRecord.managerEmail,
                      },
                      {
                        label: "Business Unit",
                        value: continuousServiceRecord.businessUnit,
                      },
                      { label: "Team", value: continuousServiceRecord.team },
                      ...(continuousServiceRecord.subTeam
                        ? [
                            {
                              label: "Sub Team",
                              value: continuousServiceRecord.subTeam,
                            },
                          ]
                        : []),
                      ...(continuousServiceRecord.unit
                        ? [
                            {
                              label: "Unit",
                              value: continuousServiceRecord.unit,
                            },
                          ]
                        : []),
                    ].map(({ label, value }) => (
                      <Typography key={label} variant="caption" display="block">
                        <strong>{label}:</strong> {value}
                      </Typography>
                    ))}
                  </Box>
                ) : null
              }
              placement="top"
              arrow
            >
              <TextField
                fullWidth
                label="Continuous Service Record"
                value={
                  errorMessage
                    ? "Error Fetching Record"
                    : continuousServiceRecord
                    ? "Record Available"
                    : "No Record"
                }
                disabled
                sx={{
                  ...textFieldSx,
                  ...disabledSx,
                  cursor:
                    continuousServiceRecord && !errorMessage
                      ? "pointer"
                      : "not-allowed",
                }}
                helperText={
                  errorMessage
                    ? "Failed to fetch record due to a server error"
                    : ""
                }
                error={!!errorMessage}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("epf", "EPF", false)}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("secondaryJobTitle", "Secondary Job Title", false)}
          </Grid>
        </Grid>
      </Box>
      <Box>
        <SectionHeader
          icon={icons.work}
          title="Job & Team"
          headerBoxSx={headerBoxSx}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              required
              label="Business Unit"
              name="businessUnitId"
              value={values.businessUnitId || ""}
              onChange={(e) =>
                setFieldValue("businessUnitId", Number(e.target.value))
              }
              onBlur={handleBlur}
              error={Boolean(touched.businessUnitId && errors.businessUnitId)}
              helperText={touched.businessUnitId && errors.businessUnitId}
              sx={textFieldSx}
            >
              {businessUnits.length ? (
                businessUnits.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {state === "loading"
                    ? "Loading business units..."
                    : "No business units found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              required
              label="Team"
              name="teamId"
              value={values.teamId || ""}
              onChange={(e) => setFieldValue("teamId", Number(e.target.value))}
              onBlur={handleBlur}
              error={Boolean(touched.teamId && errors.teamId)}
              helperText={touched.teamId && errors.teamId}
              disabled={!values.businessUnitId || values.businessUnitId === 0}
              sx={{
                ...textFieldSx,
                ...disabledSx,
              }}
            >
              {teams.length ? (
                teams.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {!values.businessUnitId || values.businessUnitId === 0
                    ? "Select business unit first"
                    : "No teams found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              required
              label="Sub Team"
              name="subTeamId"
              value={values.subTeamId || ""}
              onChange={(e) =>
                setFieldValue("subTeamId", Number(e.target.value))
              }
              onBlur={handleBlur}
              error={Boolean(touched.subTeamId && errors.subTeamId)}
              helperText={touched.subTeamId && errors.subTeamId}
              disabled={!values.teamId || values.teamId === 0}
              sx={{
                ...textFieldSx,
                ...disabledSx,
              }}
            >
              {subTeams.length ? (
                subTeams.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {!values.teamId || values.teamId === 0
                    ? "Select team first"
                    : "No sub teams found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Unit"
              name="unitId"
              value={values.unitId || ""}
              onChange={(e) => setFieldValue("unitId", Number(e.target.value))}
              onBlur={handleBlur}
              error={Boolean(touched.unitId && errors.unitId)}
              helperText={touched.unitId && errors.unitId}
              disabled={!values.subTeamId || values.subTeamId === 0}
              sx={{
                ...textFieldSx,
                ...disabledSx,
              }}
            >
              {units.length ? (
                units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {!values.subTeamId || values.subTeamId === 0
                    ? "Select sub team first"
                    : "No units found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              required
              label="Career Function"
              name="careerFunctionId"
              value={values.careerFunctionId || ""}
              onChange={(e) => {
                const newCareerFunctionId = Number(e.target.value);
                setFieldValue("careerFunctionId", newCareerFunctionId);
                setFieldValue("designationId", 0);
                if (newCareerFunctionId) {
                  dispatch(
                    fetchDesignations({ careerFunctionId: newCareerFunctionId })
                  );
                }
              }}
              onBlur={handleBlur}
              error={Boolean(
                touched.careerFunctionId && errors.careerFunctionId
              )}
              helperText={touched.careerFunctionId && errors.careerFunctionId}
              sx={textFieldSx}
            >
              {careerFunctions.length ? (
                careerFunctions.map((cf) => (
                  <MenuItem key={cf.id} value={cf.id}>
                    {cf.careerFunction}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {state === "loading"
                    ? "Loading career functions..."
                    : "No career functions found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              required
              label="Designation"
              name="designationId"
              value={values.designationId || ""}
              onChange={(e) =>
                setFieldValue("designationId", Number(e.target.value))
              }
              onBlur={handleBlur}
              error={Boolean(touched.designationId && errors.designationId)}
              helperText={touched.designationId && errors.designationId}
              disabled={
                !values.careerFunctionId || values.careerFunctionId === 0
              }
              sx={{
                ...textFieldSx,
                ...disabledSx,
              }}
            >
              {designations.length ? (
                designations.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.designation}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {!values.careerFunctionId || values.careerFunctionId === 0
                    ? "Select career function first"
                    : state === "loading"
                    ? "Loading designations..."
                    : "No designations found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <SectionHeader
          icon={icons.location}
          title="Location & Office"
          headerBoxSx={headerBoxSx}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              required
              label="Office"
              name="officeId"
              value={values.officeId || ""}
              onChange={(e) =>
                setFieldValue("officeId", Number(e.target.value))
              }
              onBlur={handleBlur}
              error={Boolean(touched.officeId && errors.officeId)}
              helperText={touched.officeId && errors.officeId}
              sx={textFieldSx}
            >
              {offices.length ? (
                offices.map((office) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {state === "loading"
                    ? "Loading offices..."
                    : "No offices found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              required
              label="Employment Location"
              name="employmentLocation"
              value={values.employmentLocation || ""}
              disabled
              error={Boolean(
                touched.employmentLocation && errors.employmentLocation
              )}
              helperText={
                touched.employmentLocation && errors.employmentLocation
              }
              sx={{
                ...textFieldSx,
                ...disabledSx,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              required
              label="Work Location"
              name="workLocation"
              value={values.workLocation || ""}
              onChange={(e) => setFieldValue("workLocation", e.target.value)}
              onBlur={handleBlur}
              error={Boolean(touched.workLocation && errors.workLocation)}
              helperText={touched.workLocation && errors.workLocation}
              disabled={!values.officeId || values.officeId === 0}
              sx={{
                ...textFieldSx,
                ...disabledSx,
              }}
            >
              {values.officeId && offices.length ? (
                offices
                  .find((office) => office.id === values.officeId)
                  ?.workingLocations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  )) || <MenuItem disabled>No locations available</MenuItem>
              ) : (
                <MenuItem disabled>Select office first</MenuItem>
              )}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <SectionHeader
          icon={icons.event}
          title="Dates & Status"
          headerBoxSx={headerBoxSx}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              required
              label="Employment Type"
              name="employmentTypeId"
              value={values.employmentTypeId || ""}
              onChange={(e) =>
                setFieldValue("employmentTypeId", Number(e.target.value))
              }
              onBlur={handleBlur}
              error={Boolean(
                touched.employmentTypeId && errors.employmentTypeId
              )}
              helperText={touched.employmentTypeId && errors.employmentTypeId}
              sx={textFieldSx}
            >
              {EmployeeTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Start Date"
              value={values.startDate ? dayjs(values.startDate) : null}
              onChange={(val) =>
                setFieldValue("startDate", val ? val.format("YYYY-MM-DD") : "")
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: Boolean(touched.startDate && errors.startDate),
                  helperText: touched.startDate && errors.startDate,
                  sx: textFieldSx,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Probation End Date"
              value={
                values.probationEndDate ? dayjs(values.probationEndDate) : null
              }
              onChange={(val) =>
                setFieldValue(
                  "probationEndDate",
                  val ? val.format("YYYY-MM-DD") : null
                )
              }
              disabled={isProbationEndDateDisabled}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(
                    touched.probationEndDate && errors.probationEndDate
                  ),
                  helperText:
                    touched.probationEndDate && errors.probationEndDate,
                  sx: { ...textFieldSx, ...disabledSx },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Agreement End Date"
              value={
                values.agreementEndDate ? dayjs(values.agreementEndDate) : null
              }
              onChange={(val) =>
                setFieldValue(
                  "agreementEndDate",
                  val ? val.format("YYYY-MM-DD") : null
                )
              }
              disabled={isAgreementEndDateDisabled}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(
                    touched.agreementEndDate && errors.agreementEndDate
                  ),
                  helperText:
                    touched.agreementEndDate && errors.agreementEndDate,
                  sx: { ...textFieldSx, ...disabledSx },
                },
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box>
        <SectionHeader
          icon={icons.supervisor}
          title="Manager & Reports"
          headerBoxSx={headerBoxSx}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              required
              label="Manager Email"
              name="managerEmail"
              value={values.managerEmail || ""}
              onChange={(e) => setFieldValue("managerEmail", e.target.value)}
              onBlur={handleBlur}
              error={Boolean(touched.managerEmail && errors.managerEmail)}
              helperText={touched.managerEmail ? errors.managerEmail ?? "" : ""}
              sx={textFieldSx}
            >
              {employeesBasicInfo.length ? (
                employeesBasicInfo.map((employee) => (
                  <MenuItem key={employee.id} value={employee.workEmail}>
                    {employee.workEmail}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {state === "loading"
                    ? "Loading employees..."
                    : "No employees found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Additional Manager Email"
              name="additionalManagerEmail"
              value={values.additionalManagerEmail || []}
              onChange={(e) => {
                const value = e.target.value;
                setFieldValue(
                  "additionalManagerEmail",
                  typeof value === "string" ? value.split(",") : value
                );
              }}
              onBlur={handleBlur}
              error={Boolean(
                touched.additionalManagerEmail && errors.additionalManagerEmail
              )}
              helperText={
                touched.additionalManagerEmail && errors.additionalManagerEmail
              }
              SelectProps={{ multiple: true }}
              sx={textFieldSx}
            >
              {employeesBasicInfo.length ? (
                employeesBasicInfo.map((employee) => (
                  <MenuItem key={employee.id} value={employee.workEmail}>
                    {employee.workEmail}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {state === "loading"
                    ? "Loading employees..."
                    : "No employees found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <SectionHeader
          icon={icons.phone}
          title="Phone"
          headerBoxSx={headerBoxSx}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("workPhoneNumber", "Work Phone Number", false)}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
