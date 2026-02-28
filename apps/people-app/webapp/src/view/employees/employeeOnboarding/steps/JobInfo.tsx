// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  useTheme,
  alpha,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
} from "@mui/material";
import { useFormikContext } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchEmployeesBasicInfo,
  fetchContinuousServiceRecord,
  resetContinuousService,
} from "@slices/employeeSlice/employee";
import {
  fetchBusinessUnits,
  fetchTeams,
  fetchSubTeams,
  fetchUnits,
  fetchCareerFunctions,
  fetchDesignations,
  fetchCompanies,
  fetchOffices,
  fetchEmploymentTypes,
} from "@slices/organizationSlice/organization";
import { CreateEmployeeFormValues } from "@root/src/types/types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  BadgeOutlined,
  WorkOutline,
  LocationOnOutlined,
  EventOutlined,
  SupervisorAccountOutlined,
  PhoneOutlined,
  HighlightOff as CloseIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

const SECTION_ICONS = {
  badge: <BadgeOutlined />,
  work: <WorkOutline />,
  location: <LocationOnOutlined />,
  event: <EventOutlined />,
  supervisor: <SupervisorAccountOutlined />,
  phone: <PhoneOutlined />,
};

export const jobInfoValidationSchema = Yup.object().shape({
  workEmail: Yup.string()
    .required("Work email is required")
    .email("Invalid email format")
    .max(254, "Email must be at most 254 characters"),
  epf: Yup.string()
    .max(45, "EPF must be at most 45 characters")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  secondaryJobTitle: Yup.string().required("Secondary job title is required"),
  businessUnitId: Yup.number()
    .required("Business unit is required")
    .min(1, "Select a valid business unit"),
  teamId: Yup.number()
    .required("Team is required")
    .min(1, "Select a valid team"),
  subTeamId: Yup.number()
    .required("Sub Team is required")
    .min(1, "Select a valid sub team"),
  unitId: Yup.number().optional(),
  careerFunctionId: Yup.number()
    .required("Career function is required")
    .min(1, "Select a valid career function"),
  designationId: Yup.number()
    .required("Designation is required")
    .min(1, "Select a valid designation"),
  companyId: Yup.number()
    .required("Company is required")
    .min(1, "Select a valid company"),
  officeId: Yup.number().optional(),
  workLocation: Yup.string()
    .required("Work location is required")
    .min(1, "Select a valid work location"),
  employmentTypeId: Yup.number()
    .required("Employment type is required")
    .min(1, "Select a valid employment type"),
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
  },
);

export default function JobInfoStep() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { values, handleChange, handleBlur, touched, errors, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();
  const {
    employeesBasicInfo,
    employeeBasicInfoState,
    continuousServiceRecord,
    errorMessage,
  } = useAppSelector((s) => s.employee);
  const {
    state: organizationState,
    businessUnits,
    teams,
    subTeams,
    units,
    careerFunctions,
    designations,
    companies,
    offices,
    employmentTypes,
  } = useAppSelector((state) => state.organization);

  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(
    null,
  );

  const initialLoadRef = useRef({
    teams: false,
    subTeams: false,
    units: false,
    designations: false,
    offices: false,
  });

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
    [theme],
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
        0.2,
      )}, ${alpha(theme.palette.secondary.contrastText, 0.1)})`,
      color: theme.palette.secondary.contrastText,
    }),
    [theme],
  );

  const disabledSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root.Mui-disabled": {
        backgroundColor: alpha(theme.palette.action.disabledBackground, 0.05),
      },
    }),
    [theme],
  );

  const managerEmailOptions = useMemo(() => {
    const list = employeesBasicInfo.map((e) => e.workEmail).filter(Boolean);
    if (values.managerEmail && !list.includes(values.managerEmail)) {
      return [values.managerEmail, ...list];
    }
    return list;
  }, [employeesBasicInfo, values.managerEmail]);

  const additionalManagerOptions = useMemo(() => {
    const list = employeesBasicInfo.map((e) => e.workEmail).filter(Boolean);
    const selected = values.additionalManagerEmail ?? [];
    const missing = selected.filter((email) => email && !list.includes(email));
    return [...missing, ...list];
  }, [employeesBasicInfo, values.additionalManagerEmail]);

  useEffect(() => {
    dispatch(fetchBusinessUnits());
    dispatch(fetchCompanies());
    dispatch(fetchCareerFunctions());
    dispatch(fetchEmployeesBasicInfo());
    dispatch(fetchEmploymentTypes());

    return () => {
      dispatch(resetContinuousService());
    };
  }, [dispatch]);

  useEffect(() => {
    const hasInitialValues =
      values.businessUnitId > 0 ||
      values.careerFunctionId > 0 ||
      values.companyId > 0;

    if (!hasInitialValues) return;

    if (values.businessUnitId > 0 && !initialLoadRef.current.teams) {
      dispatch(fetchTeams({ id: values.businessUnitId }));
      initialLoadRef.current.teams = true;
    }
    if (values.teamId > 0 && !initialLoadRef.current.subTeams) {
      dispatch(fetchSubTeams({ id: values.teamId }));
      initialLoadRef.current.subTeams = true;
    }
    if (values.subTeamId > 0 && !initialLoadRef.current.units) {
      dispatch(fetchUnits({ id: values.subTeamId }));
      initialLoadRef.current.units = true;
    }
    if (values.careerFunctionId > 0 && !initialLoadRef.current.designations) {
      dispatch(
        fetchDesignations({ careerFunctionId: values.careerFunctionId }),
      );
      initialLoadRef.current.designations = true;
    }
    if (values.companyId > 0 && !initialLoadRef.current.offices) {
      dispatch(fetchOffices({ id: values.companyId }));
      initialLoadRef.current.offices = true;
    }
  }, [
    dispatch,
    values.businessUnitId,
    values.teamId,
    values.subTeamId,
    values.careerFunctionId,
    values.companyId,
  ]);

  useEffect(() => {
    const recordCount = continuousServiceRecord?.length ?? 0;

    if (recordCount === 0) {
      setSelectedRecordIndex(null);
    } else if (selectedRecordIndex === null) {
      setSelectedRecordIndex(0);
    }
  }, [continuousServiceRecord, selectedRecordIndex]);

  const handleCareerFunctionChange = useCallback(
    (newCareerFunctionId: number) => {
      setFieldValue("careerFunctionId", newCareerFunctionId);
      setFieldValue("designationId", 0);

      if (newCareerFunctionId > 0) {
        dispatch(fetchDesignations({ careerFunctionId: newCareerFunctionId }));
        initialLoadRef.current.designations = true;
      }
    },
    [dispatch, setFieldValue],
  );

  const handleCompanyChange = useCallback(
    (newCompanyId: number) => {
      const currentCompanyId = values.companyId;
      setFieldValue("companyId", newCompanyId);

      if (newCompanyId > 0) {
        dispatch(fetchOffices({ id: newCompanyId }));
        initialLoadRef.current.offices = true;

        if (!currentCompanyId || currentCompanyId !== newCompanyId) {
          setFieldValue("officeId", 0);
          setFieldValue("workLocation", "");
        }
      }
    },
    [dispatch, setFieldValue, values.companyId],
  );

  const handleBusinessUnitChange = useCallback(
    (newBusinessUnitId: number) => {
      const prevBusinessUnitId = values.businessUnitId;
      setFieldValue("businessUnitId", newBusinessUnitId);

      if (newBusinessUnitId > 0) {
        dispatch(fetchTeams({ id: newBusinessUnitId }));
        initialLoadRef.current.teams = true;

        if (prevBusinessUnitId !== newBusinessUnitId) {
          setFieldValue("teamId", 0);
          setFieldValue("subTeamId", 0);
          setFieldValue("unitId", 0);
          initialLoadRef.current.subTeams = false;
          initialLoadRef.current.units = false;
        }
      } else {
        setFieldValue("teamId", 0);
        setFieldValue("subTeamId", 0);
        setFieldValue("unitId", 0);
      }
    },
    [dispatch, setFieldValue, values.businessUnitId],
  );

  const handleTeamChange = useCallback(
    (newTeamId: number) => {
      const prevTeamId = values.teamId;
      setFieldValue("teamId", newTeamId);

      if (newTeamId > 0) {
        dispatch(fetchSubTeams({ id: newTeamId }));
        initialLoadRef.current.subTeams = true;

        if (prevTeamId !== newTeamId) {
          setFieldValue("subTeamId", 0);
          setFieldValue("unitId", 0);
          initialLoadRef.current.units = false;
        }
      } else {
        setFieldValue("subTeamId", 0);
        setFieldValue("unitId", 0);
      }
    },
    [dispatch, setFieldValue, values.teamId],
  );

  const handleSubTeamChange = useCallback(
    (newSubTeamId: number) => {
      const prevSubTeamId = values.subTeamId;
      setFieldValue("subTeamId", newSubTeamId);

      if (newSubTeamId > 0) {
        dispatch(fetchUnits({ id: newSubTeamId }));
        initialLoadRef.current.units = true;

        if (prevSubTeamId !== newSubTeamId) {
          setFieldValue("unitId", 0);
        }
      } else {
        setFieldValue("unitId", 0);
      }
    },
    [dispatch, setFieldValue, values.subTeamId],
  );

  const handleOfficeChange = useCallback(
    (newOfficeId: number) => {
      setFieldValue("officeId", newOfficeId);
    },
    [setFieldValue],
  );

  const handleRelocationChange = useCallback(
    (checked: boolean) => {
      setFieldValue("isRelocation", checked);

      if (!checked) {
        setFieldValue("continuousServiceRecord", null);
        return;
      }

      const record =
        selectedRecordIndex !== null
          ? continuousServiceRecord?.[selectedRecordIndex]
          : continuousServiceRecord?.[0];
      setFieldValue("continuousServiceRecord", record?.employeeId ?? null);
    },
    [setFieldValue, selectedRecordIndex, continuousServiceRecord],
  );

  return (
    <Box sx={{ width: "100%", px: 0 }}>
      <Box>
        <SectionHeader
          icon={SECTION_ICONS.badge}
          title="Identity"
          headerBoxSx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            mt: 4,
          }}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              required
              name="workEmail"
              label="Work Email"
              value={values.workEmail ?? ""}
              onChange={handleChange}
              onBlur={(e: { target: { value: string } }) => {
                handleBlur(e);
                const email = e.target.value?.trim();
                if (email && Yup.string().email().isValidSync(email)) {
                  dispatch(fetchContinuousServiceRecord(email));
                } else {
                  dispatch(resetContinuousService());
                  setSelectedRecordIndex(null);
                }
              }}
              error={Boolean(touched.workEmail && errors.workEmail)}
              helperText={touched.workEmail && errors.workEmail}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip
              title={
                continuousServiceRecord && !errorMessage ? (
                  <Box sx={{ p: 1, maxWidth: 400 }}>
                    <Typography variant="caption" fontWeight={600}>
                      Continuous Service Record Details
                    </Typography>

                    {(() => {
                      const record =
                        selectedRecordIndex !== null
                          ? continuousServiceRecord[selectedRecordIndex]
                          : continuousServiceRecord[0];

                      if (!record) return null;

                      const fields = [
                        { label: "Employee ID", value: record.employeeId },
                        {
                          label: "Name",
                          value: `${record.firstName || ""} ${
                            record.lastName || ""
                          }`.trim(),
                        },
                        { label: "Designation", value: record.designation },
                        { label: "Work Location", value: record.workLocation },
                        {
                          label: "Start Date",
                          value: dayjs(record.startDate).format("YYYY-MM-DD"),
                        },
                        { label: "Manager Email", value: record.managerEmail },
                        {
                          label: "Additional Managers",
                          value: record.additionalManagerEmails,
                        },
                        { label: "Business Unit", value: record.businessUnit },
                        { label: "Team", value: record.team },
                        ...(record.subTeam
                          ? [{ label: "Sub Team", value: record.subTeam }]
                          : []),
                        ...(record.unit
                          ? [{ label: "Unit", value: record.unit }]
                          : []),
                      ];

                      return fields.map((f) => (
                        <Typography
                          key={f.label}
                          variant="caption"
                          display="block"
                        >
                          <strong>{f.label}:</strong> {f.value || "N/A"}
                        </Typography>
                      ));
                    })()}
                  </Box>
                ) : null
              }
              placement="top"
              arrow
            >
              {continuousServiceRecord?.length === 1 ? (
                <TextField
                  fullWidth
                  label="Employee ID (Previous)"
                  value={continuousServiceRecord[0]?.employeeId || ""}
                  disabled
                  sx={{
                    ...textFieldSx,
                    ...disabledSx,
                    cursor: "pointer",
                  }}
                />
              ) : continuousServiceRecord?.length > 1 ? (
                <TextField
                  select
                  fullWidth
                  label="Employee ID (Previous)"
                  value={selectedRecordIndex ?? ""}
                  onChange={(e) => {
                    const index = Number(e.target.value);
                    setSelectedRecordIndex(index);
                    setFieldValue(
                      "continuousServiceRecord",
                      continuousServiceRecord[index].employeeId,
                    );
                  }}
                  disabled={!!errorMessage}
                  sx={{ ...textFieldSx, cursor: "pointer" }}
                  helperText={
                    errorMessage ? "Failed to fetch record" : undefined
                  }
                  error={!!errorMessage}
                >
                  {continuousServiceRecord.map((rec, idx) => (
                    <MenuItem key={idx} value={idx}>
                      {rec.employeeId} -{" "}
                      {`${rec.firstName || ""} ${rec.lastName || ""}`.trim() ||
                        "N/A"}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label="Continuous Service Record"
                  value={errorMessage ? "Error" : "No Record"}
                  disabled
                  error={!!errorMessage}
                  helperText={errorMessage || ""}
                  sx={{
                    ...textFieldSx,
                    ...disabledSx,
                  }}
                />
              )}
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!values.isRelocation}
                  onChange={(e) => handleRelocationChange(e.target.checked)}
                />
              }
              label="Relocation"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="EPF"
              name="epf"
              value={values.epf ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched.epf && errors.epf)}
              helperText={touched.epf && errors.epf}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              required
              label="Secondary Job Title"
              name="secondaryJobTitle"
              value={values.secondaryJobTitle ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.secondaryJobTitle && errors.secondaryJobTitle,
              )}
              helperText={touched.secondaryJobTitle && errors.secondaryJobTitle}
              sx={textFieldSx}
            />
          </Grid>
        </Grid>
      </Box>
      <Box>
        <SectionHeader
          icon={SECTION_ICONS.work}
          title="Job & Team"
          headerBoxSx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            mt: 4,
          }}
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
              onChange={(e) => handleBusinessUnitChange(Number(e.target.value))}
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
                  {organizationState === "loading"
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
              onChange={(e) => handleTeamChange(Number(e.target.value))}
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
              onChange={(e) => handleSubTeamChange(Number(e.target.value))}
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
              <MenuItem value={0}>
                <em>None</em>
              </MenuItem>
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
              onChange={(e) =>
                handleCareerFunctionChange(Number(e.target.value))
              }
              onBlur={handleBlur}
              error={Boolean(
                touched.careerFunctionId && errors.careerFunctionId,
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
                  {organizationState === "loading"
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
                    : organizationState === "loading"
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
          icon={SECTION_ICONS.location}
          title="Location & Office"
          headerBoxSx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            mt: 4,
          }}
          iconBoxSx={iconBoxSx}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              required
              label="Company"
              name="companyId"
              value={values.companyId || ""}
              onChange={(e) => handleCompanyChange(Number(e.target.value))}
              onBlur={handleBlur}
              error={Boolean(touched.companyId && errors.companyId)}
              helperText={touched.companyId && errors.companyId}
              sx={textFieldSx}
            >
              {companies.length ? (
                companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {organizationState === "loading"
                    ? "Loading companies..."
                    : "No companies found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Office"
              name="officeId"
              value={values.officeId || ""}
              onChange={(e) => handleOfficeChange(Number(e.target.value))}
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
                  {organizationState === "loading"
                    ? "Loading offices..."
                    : "No offices found"}
                </MenuItem>
              )}
            </TextField>
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
              sx={textFieldSx}
            >
              {values.companyId && companies.length ? (
                companies
                  .find((company) => company.id === values.companyId)
                  ?.allowedLocations?.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  )) || <MenuItem disabled>No locations available</MenuItem>
              ) : (
                <MenuItem disabled>
                  {!values.companyId || values.companyId === 0
                    ? "Select company first"
                    : organizationState === "loading"
                      ? "Loading companies..."
                      : "No locations found"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <SectionHeader
          icon={SECTION_ICONS.event}
          title="Dates & Status"
          headerBoxSx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            mt: 4,
          }}
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
                touched.employmentTypeId && errors.employmentTypeId,
              )}
              helperText={touched.employmentTypeId && errors.employmentTypeId}
              disabled={organizationState === "loading"}
              sx={textFieldSx}
            >
              {employmentTypes.length > 0 ? (
                employmentTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {organizationState === "loading"
                    ? "Loading employment types..."
                    : "No employment types available"}
                </MenuItem>
              )}
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
                  val ? val.format("YYYY-MM-DD") : null,
                )
              }
              slotProps={{
                field: { clearable: true },
                textField: {
                  fullWidth: true,
                  error: Boolean(
                    touched.probationEndDate && errors.probationEndDate,
                  ),
                  helperText:
                    touched.probationEndDate && errors.probationEndDate,
                  sx: textFieldSx,
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
                  val ? val.format("YYYY-MM-DD") : null,
                )
              }
              slotProps={{
                field: { clearable: true },
                textField: {
                  fullWidth: true,
                  error: Boolean(
                    touched.agreementEndDate && errors.agreementEndDate,
                  ),
                  helperText:
                    touched.agreementEndDate && errors.agreementEndDate,
                  sx: textFieldSx,
                },
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box>
        <SectionHeader
          icon={SECTION_ICONS.supervisor}
          title="Manager & Reports"
          headerBoxSx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            mt: 4,
          }}
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
              helperText={
                touched.managerEmail ? (errors.managerEmail ?? "") : ""
              }
              sx={textFieldSx}
            >
              {managerEmailOptions.length ? (
                managerEmailOptions.map((email) => (
                  <MenuItem key={email} value={email}>
                    {email}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {employeeBasicInfoState === "loading"
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
                  typeof value === "string" ? value.split(",") : value,
                );
              }}
              onBlur={handleBlur}
              error={Boolean(
                touched.additionalManagerEmail && errors.additionalManagerEmail,
              )}
              helperText={
                touched.additionalManagerEmail && errors.additionalManagerEmail
              }
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ flexWrap: "wrap", gap: 0.5 }}
                  >
                    {(selected as string[]).map((email) => (
                      <Chip
                        key={email}
                        label={email}
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                        onDelete={(e) => {
                          e.stopPropagation();
                          const updated = (
                            values.additionalManagerEmail || []
                          ).filter((em) => em !== email);
                          setFieldValue("additionalManagerEmail", updated);
                        }}
                        deleteIcon={
                          <CloseIcon
                            fontSize="small"
                            sx={{ color: "error.main" }}
                            aria-label={`Remove ${email}`}
                          />
                        }
                        sx={{
                          maxWidth: 200,
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    ))}
                  </Stack>
                ),
              }}
              sx={textFieldSx}
            >
              {additionalManagerOptions.length ? (
                additionalManagerOptions
                  .filter((email) => email !== values.managerEmail)
                  .map((email) => (
                    <MenuItem key={email} value={email}>
                      {email}
                    </MenuItem>
                  ))
              ) : (
                <MenuItem disabled>
                  {employeeBasicInfoState === "loading"
                    ? "Loading employees..."
                    : values.managerEmail
                      ? "No other managers available"
                      : "Select primary manager first"}
                </MenuItem>
              )}
            </TextField>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
