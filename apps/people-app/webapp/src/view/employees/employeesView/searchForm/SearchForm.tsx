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
} from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import React from "react";

type SearchFormProps = { page: number; perPage: number };

export function SearchForm({ page, perPage }: SearchFormProps) {
  const dispatch = useAppDispatch();
  const employeeState = useAppSelector((state) => state.employee);

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      BorderColor: "divider",
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
          {({ values, handleChange, handleBlur, resetForm }) => (
            <Form>
              <Box 
                sx={{
                  display: "flex",
                  flexDirection: "column", 
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography
                    variant="h5"
                    sx={(theme) => ({ color: theme.palette.text.secondary })}
                  >
                    Search Filters
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="text"
                      startIcon={<TuneOutlinedIcon 
                        sx={{
                          color: (theme) => theme.palette.secondary.contrastText
                        }}
                        />}
                      onClick={handleToggle}
                      sx={{
                        mb: 2,
                        minWidth: "100px",
                      }}
                    >
                      <Typography variant="h6" sx={{ color: (theme) => theme.palette.secondary.contrastText }}>{isOpen ? "Less" : "More"}</Typography>
                    </Button>
                    <Button
                      variant="contained"
                      type="submit"
                      sx={{
                        mb: 2,
                        minWidth: "100px"
                      }}
                      color="secondary"
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
                </Box>
                <Grid container spacing={2} sx={{ justifyContent: "center" }}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      size="small"
                      fullWidth
                      id="firstName"
                      name="firstName"
                      label="First Name"
                      value={values.firstName ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      size="small"
                      fullWidth
                      id="lastName"
                      name="lastName"
                      label="Last Name"
                      value={values.lastName ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      size="small"
                      fullWidth
                      id="personalEmail"
                      name="personalEmail"
                      label="Personal Email"
                      value={values.personalEmail ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      size="small"
                      fullWidth
                      id="nicOrPassport"
                      name="nicOrPassport"
                      label="NIC / Passport"
                      value={values.nicOrPassport ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      size="small"
                      fullWidth
                      id="businessUnit"
                      name="businessUnit"
                      label="Business Unit"
                      value={values.businessUnit ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      size="small"
                      fullWidth
                      id="team"
                      name="team"
                      label="Team"
                      value={values.team ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>
                <Box
                  sx={{
                    mt:2,
                    display: "flex", 
                    alignItems: "center" 
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
                    <AccordionDetails sx={{ px:0, py: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={2}>
                          <TextField
                            size="small"
                            fullWidth
                            id="gender"
                            name="gender"
                            label="Gender"
                            value={values.gender ?? ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
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
                        <Grid item xs={12} md={2}>
                          <TextField
                            size="small"
                            fullWidth
                            id="personalPhone"
                            name="personalPhone"
                            label="Personal Phone"
                            value={values.personalPhone ?? ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
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
                        <Grid item xs={12} md={2}>
                          <TextField
                            size="small"
                            fullWidth
                            id="country"
                            name="country"
                            label="Country"
                            value={values.country ?? ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            size="small"
                            fullWidth
                            id="subTeam"
                            name="subTeam"
                            label="Sub Team"
                            value={values.subTeam ?? ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            size="small"
                            fullWidth
                            id="designation"
                            name="designation"
                            label="Designation"
                            value={values.designation ?? ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            size="small"
                            fullWidth
                            id="employmentType"
                            name="employmentType"
                            label="Employment Type"
                            value={values.employmentType ?? ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            size="small"
                            fullWidth
                            id="unit"
                            name="unit"
                            label="Unit"
                            value={values.unit ?? ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={fieldSx}
                          />
                        </Grid>
                      </Grid>
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
