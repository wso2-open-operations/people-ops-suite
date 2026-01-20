import { Form, Formik } from "formik";
import {
  EmployeeFilterAttributes,
  setEmployeeFilter,
} from "@slices/employeeSlice/employee";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  Box,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";

import {
  BusinessUnit,
  fetchBusinessUnits,
  fetchDesignations,
  fetchEmploymentTypes,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
  SubTeam,
  Team,
  Unit,
} from "@root/src/slices/organizationSlice/organization";
import { Countries, EmployeeGenders } from "@root/src/config/constant";
import { OrganizationTreeFilters } from "./OrganizationTreeFilters";

type SearchFormProps = { page: number; perPage: number };

export function SearchForm({ page, perPage }: SearchFormProps) {
  const dispatch = useAppDispatch();
  const employeeState = useAppSelector((state) => state.employee);
  const {
    state: organizationState,
    businessUnits,
    teams,
    subTeams,
    units,
    designations,
    offices,
    employmentTypes,
  } = useAppSelector((state) => state.organization);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch(fetchEmploymentTypes());
    dispatch(fetchDesignations({}));
    dispatch(fetchTeams({}));
    dispatch(fetchSubTeams({}));
    dispatch(fetchUnits({}));
    dispatch(fetchBusinessUnits());
  }, [dispatch]);

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      borderColor: "divider",
      backgroundColor: "transparent",
    },
  };

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);
  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl((prev) => (prev ? null : event.currentTarget));
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box>
        <Formik<EmployeeFilterAttributes>
          initialValues={{ ...employeeState.employeeFilter }}
          enableReinitialize
          onSubmit={async (values: EmployeeFilterAttributes) => {
            const nextFilter: EmployeeFilterAttributes = {
              ...values,
              page,
              perPage,
            };
            dispatch(setEmployeeFilter(nextFilter));
          }}
        >
          {({ values, handleChange, handleBlur, resetForm, setFieldValue }) => (
            <Form>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={(theme) => ({ color: theme.palette.text.secondary })}
                  >
                    Search Filters
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="text"
                      startIcon={
                        <TuneOutlinedIcon
                          sx={{
                            color: (theme) =>
                              theme.palette.secondary.contrastText,
                          }}
                        />
                      }
                      onClick={handleToggle}
                      sx={{
                        mb: 2,
                        minWidth: "100px",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: (theme) =>
                            theme.palette.secondary.contrastText,
                        }}
                      >
                        {isOpen ? "Less" : "More"}
                      </Typography>
                    </Button>
                  </Box>
                </Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      size="small"
                      fullWidth
                      id="searchString"
                      name="searchString"
                      label="Search (name, email, etc.)"
                      value={values.searchString ?? ""}
                      onBlur={handleBlur}
                      sx={fieldSx}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleChange(e);
                        if (debounceRef.current) {
                          window.clearTimeout(debounceRef.current);
                        }

                        debounceRef.current = window.setTimeout(() => {
                          dispatch(
                            setEmployeeFilter({
                              ...values,
                              searchString: value,
                              page,
                              perPage,
                            })
                          );
                        }, 1000); // 1000ms is the sweet spot for search UX
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="Clear search"
                              edge="end"
                              size="small"
                              disabled={!values.searchString}
                              onClick={() => {
                                setFieldValue("searchString", undefined);
                                if (debounceRef.current) {
                                  window.clearTimeout(debounceRef.current);
                                }

                                dispatch(
                                  setEmployeeFilter({
                                    ...values,
                                    searchString: "",
                                    page,
                                    perPage,
                                  })
                                );
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          "& input": {
                            paddingRight: "40px",
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Accordion
                  expanded={isOpen}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 0,
                    borderTop: 1,
                    borderColor: "divider",
                    overflow: "hidden",
                    backgroundColor: "background.default",
                    width: "100%",
                  }}
                >
                  <AccordionSummary
                    sx={{
                      p: 0,
                      minHeight: 0,
                      "& .MuiAccordionSummary-content": { my: 0 },
                      backgroundColor: "background.default",
                    }}
                  />
                  <AccordionDetails
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      px: 0,
                      py: 2,
                    }}
                  >
                    <Grid container spacing={2} alignItems="stretch" sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6} sx={{ display: "flex" }}>
                        <OrganizationTreeFilters
                          values={values}
                          setFieldValue={setFieldValue}
                          fieldSx={fieldSx}
                          businessUnits={businessUnits}
                          teams={teams}
                          subTeams={subTeams}
                          units={units}
                          onSelectBusinessUnit={(id) => {
                            if (id) dispatch(fetchTeams({ id }));
                          }}
                          onSelectTeam={(id) => {
                            if (id) dispatch(fetchSubTeams({ id }));
                          }}
                          onSelectSubTeam={(id) => {
                            if (id) dispatch(fetchUnits({ id }));
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6} sx={{ display: "flex" }}>
                        <Box
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            p: 2,
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            Other Filters
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                size="small"
                                fullWidth
                                id="gender"
                                name="gender"
                                label="Gender"
                                value={values.gender ?? ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                sx={fieldSx}
                              >
                                {EmployeeGenders.map((gender) => (
                                  <MenuItem key={gender} value={gender}>
                                    {gender}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                size="small"
                                fullWidth
                                id="nationality"
                                name="nationality"
                                label="Nationality"
                                value={values.nationality ?? ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                sx={fieldSx}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                size="small"
                                fullWidth
                                id="city"
                                name="city"
                                label="City"
                                value={values.city ?? ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                sx={fieldSx}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                size="small"
                                fullWidth
                                id="country"
                                name="country"
                                label="Country"
                                value={values.country ?? ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                sx={fieldSx}
                              >
                                {Countries.map((country) => (
                                  <MenuItem key={country} value={country}>
                                    {country}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                size="small"
                                fullWidth
                                id="designation"
                                name="designation"
                                label="Designation"
                                value={values.designation ?? ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                sx={fieldSx}
                              >
                                {designations.map((d) => (
                                  <MenuItem key={d.id} value={d.designation}>
                                    {d.designation}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                size="small"
                                fullWidth
                                id="employmentType"
                                name="employmentType"
                                label="Employment Type"
                                value={values.employmentType ?? ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                sx={fieldSx}
                              >
                                {employmentTypes.map((et) => (
                                  <MenuItem key={et.id} value={et.name}>
                                    {et.name}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    </Grid>
                    <Box
                      sx={{ alignSelf: "flex-end", display: "flex", gap: 2 }}
                    >
                      <Button
                        variant="contained"
                        type="submit"
                        sx={{
                          mb: 2,
                          minWidth: "100px",
                        }}
                        color="secondary"
                        onClick={() => {
                          console.log(values);
                        }}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outlined"
                        type="reset"
                        sx={{
                          mb: 2,
                          minWidth: "100px",
                        }}
                        onClick={() => {
                          resetForm();
                          dispatch(
                            setEmployeeFilter({
                              page,
                              perPage,
                            } as EmployeeFilterAttributes)
                          );
                        }}
                      >
                        Reset
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
}
