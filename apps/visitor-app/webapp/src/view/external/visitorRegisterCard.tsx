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
import React, { useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Person as PersonIcon,
  Check,
  Delete as DeleteIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { FieldArray, Form, Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useConfirmationModalContext } from "@root/src/context/DialogContext";
import { ConfirmationType, State } from "@root/src/types/types";
import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@root/src/slices/store";
import {
  getVisitInvitationAsync,
  submitVisitAsync,
} from "@slices/invitationSlice/invitationSlice";
import { hash } from "@root/src/utils/utils";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";
import { enqueueSnackbarMessage } from "@root/src/slices/commonSlice/common";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useSnackbar } from "notistack";
import StateWithImage from "@root/src/component/ui/StateWithImage";

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
  // passNumber: string;
  status: VisitorStatus;
}

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

const visitorValidationSchema = Yup.object().shape({
  visitors: Yup.array().of(
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
      // passNumber: Yup.string().required("Pass number is required"),
    })
  ),
});

function transformVisitors(visitors: Array<any>): VisitorDetail[] {
  return visitors.map((v) => {
    // idPassportNumber → remove the last digit from NIC
    const idPassportNumber = v.nicNumber.slice(0, -1);

    // Full name → capitalize first + last name if available,
    // otherwise just capitalize given name
    const parts = v.name.trim().split(/\s+/);
    const fullName = parts
      .map((p: any) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");

    // Contact → separate country code and number
    const match = v.contactNumber.match(/^(\+\d{2})(\d+)$/);
    let countryCode = "";
    let contactNumber = v.contactNumber;
    if (match) {
      countryCode = match[1];
      contactNumber = match[2];
      // remove leading 0 if exists
      if (contactNumber.startsWith("0")) {
        contactNumber = contactNumber.slice(1);
      }
    }

    return {
      idPassportNumber,
      fullName,
      contactNumber,
      countryCode,
      emailAddress: v.email,
      status: VisitorStatus.Completed,
    };
  });
}

function VisitorRegisterCard() {
  const token = new URLSearchParams(window.location.search).get("token");
  const dispatch = useAppDispatch();
  const visitorState = useAppSelector((state: RootState) => state.visitor);
  const visitState = useAppSelector((state: RootState) => state.visit);
  const externalState = useAppSelector((state: RootState) => state.invitation);
  // const dialogContext = useConfirmationModalContext();
  const { enqueueSnackbar } = useSnackbar();
  const common = useAppSelector((state: RootState) => state.common);

  useEffect(() => {
    dispatch(getVisitInvitationAsync(token ?? ""));
  }, []);

  const defaultVisitors: VisitorDetail[] = externalState.visitInvitation
    ? transformVisitors(externalState.visitInvitation?.invitees)
    : [];

  const showSnackbar = () => {
    if (common.timestamp != null) {
      enqueueSnackbar(common.message, {
        variant: common.type,
        preventDuplicate: true,
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
      });
    }
  };

  useEffect(() => {
    showSnackbar();
  }, [showSnackbar]);

  const submitVisit = async (
    values: { visitors: VisitorDetail[] },
    formikHelpers: FormikHelpers<any>
  ) => {
    console.log(values.visitors);
    const { setSubmitting, resetForm } = formikHelpers;
    try {
      const visitorsToSubmit = values.visitors.filter(
        (visitor) => visitor.status === VisitorStatus.Draft
      );

      if (visitorsToSubmit.length === 0) {
        dispatch(
          enqueueSnackbarMessage({
            message: "No draft visitors to submit",
            type: "warning",
          })
        );
        return;
      }

      const visitors = await Promise.all(
        visitorsToSubmit.map(async (visitor) => ({
          nicHash: await hash(visitor.idPassportNumber),
          name: visitor.fullName,
          nicNumber: visitor.idPassportNumber,
          contactNumber: visitor.countryCode + visitor.contactNumber,
          email: visitor.emailAddress,
        }))
      );

      const visitData = { visitors };

      console.log("VisitDetails", visitData);

      await dispatch(
        submitVisitAsync({ visitData, invitationId: token ?? "" })
      );

      dispatch(
        enqueueSnackbarMessage({
          message: "Visitors submitted successfully",
          type: "success",
        })
      );

      resetForm({
        values: {
          visitors: values.visitors.map((visitor) =>
            visitor.status === VisitorStatus.Draft
              ? { ...visitor, status: VisitorStatus.Completed }
              : visitor
          ),
        },
      });
    } catch (error) {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to submit visitors",
          type: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${
            require("@assets/images/wso2-logo.svg").default
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.1,
          zIndex: -1,
        }}
      ></Box>
      {(visitorState.state === State.loading ||
        visitorState.submitState === State.loading ||
        visitState.state === State.loading ||
        externalState.submitState === State.loading ||
        externalState.fetchState === State.loading ||
        visitState.submitState === State.loading) && (
        <BackgroundLoader
          open={true}
          message={
            visitorState.state === State.loading ||
            visitorState.submitState === State.loading
              ? visitorState.stateMessage
              : visitState.stateMessage
          }
        />
      )}
      {externalState.visitInvitation?.isActive == 1 ? (
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                Visitor Registration
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Complete the form below to register your visitors
              </Typography>
            </Box>

            <Card
              variant="outlined"
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                "@supports not (backdrop-filter: blur(10px))": {
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  Visit Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <BusinessIcon color="primary" />
                      <b>Company:</b>{" "}
                      {
                        externalState.visitInvitation?.visitDetails
                          .nameOfCompany
                      }
                    </Typography>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <PersonIcon color="primary" />
                      <b>Whom to Meet:</b>{" "}
                      {externalState.visitInvitation?.visitDetails.whomTheyMeet}
                    </Typography>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <WorkIcon color="primary" />
                      <b>Purpose:</b>{" "}
                      {
                        externalState.visitInvitation?.visitDetails
                          .purposeOfVisit
                      }
                    </Typography>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CheckCircleIcon color="primary" />
                      <b>Number of Invitations:</b>{" "}
                      {externalState.visitInvitation?.noOfInvitations}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <ScheduleIcon color="primary" />
                      <b>Created On:</b>{" "}
                      {externalState.visitInvitation?.createdOn}
                    </Typography>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <ScheduleIcon color="primary" />
                      <b>Entry:</b>{" "}
                      {externalState.visitInvitation?.visitDetails.timeOfEntry}
                    </Typography>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <ScheduleIcon color="primary" />
                      <b>Departure:</b>{" "}
                      {
                        externalState.visitInvitation?.visitDetails
                          .timeOfDeparture
                      }
                    </Typography>
                    <Typography
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <LocationOnIcon color="primary" />
                      <b>Location:</b>{" "}
                      {externalState.visitInvitation?.visitDetails.accessibleLocations
                        .map((loc: any) => loc.floor)
                        .join(", ")}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Formik
              initialValues={{
                visitors: defaultVisitors,
              }}
              validationSchema={visitorValidationSchema}
              onSubmit={(values, formikHelpers) =>
                submitVisit(values, formikHelpers)
              }
            >
              {(formik) => (
                <Form>
                  <FieldArray name="visitors">
                    {({ remove, push }) => (
                      <Box sx={{ mt: 2 }}>
                        {formik.values.visitors.map(
                          (visitor: VisitorDetail, index: number) => (
                            <Card
                              variant="outlined"
                              sx={{
                                mb: 2,
                                borderRadius: 2,
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                backdropFilter: "blur(10px)",
                                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                              }}
                              key={index}
                            >
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
                                  {visitor.status === VisitorStatus.Draft &&
                                    formik.values.visitors.length > 1 && (
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
                                      onChange={(event) =>
                                        formik.setFieldValue(
                                          `visitors.${index}.idPassportNumber`,
                                          event.target.value.toUpperCase()
                                        )
                                      }
                                      error={
                                        formik.touched.visitors?.[index]
                                          ?.idPassportNumber &&
                                        Boolean(
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.idPassportNumber
                                        )
                                      }
                                      helperText={
                                        formik.touched.visitors?.[index]
                                          ?.idPassportNumber &&
                                        (
                                          formik.errors.visitors?.[
                                            index
                                          ] as import("formik").FormikErrors<VisitorDetail>
                                        )?.idPassportNumber
                                      }
                                      variant="outlined"
                                      disabled={
                                        visitor.status ===
                                        VisitorStatus.Completed
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
                                      error={
                                        formik.touched.visitors?.[index]
                                          ?.fullName &&
                                        Boolean(
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.fullName
                                        )
                                      }
                                      helperText={
                                        formik.touched.visitors?.[index]
                                          ?.fullName &&
                                        (
                                          formik.errors.visitors?.[
                                            index
                                          ] as import("formik").FormikErrors<VisitorDetail>
                                        )?.fullName
                                      }
                                      variant="outlined"
                                      disabled={
                                        visitor.status ===
                                        VisitorStatus.Completed
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
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.contactNumber
                                        )
                                      }
                                      helperText={
                                        formik.touched.visitors?.[index]
                                          ?.contactNumber &&
                                        (
                                          formik.errors.visitors?.[
                                            index
                                          ] as import("formik").FormikErrors<VisitorDetail>
                                        )?.contactNumber
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
                                              InputProps={{
                                                disableUnderline: true,
                                              }}
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
                                        visitor.status ===
                                        VisitorStatus.Completed
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
                                      error={
                                        formik.touched.visitors?.[index]
                                          ?.emailAddress &&
                                        Boolean(
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.emailAddress
                                        )
                                      }
                                      helperText={
                                        formik.touched.visitors?.[index]
                                          ?.emailAddress &&
                                        (
                                          formik.errors.visitors?.[
                                            index
                                          ] as import("formik").FormikErrors<VisitorDetail>
                                        )?.emailAddress
                                      }
                                      variant="outlined"
                                      disabled={
                                        visitor.status ===
                                        VisitorStatus.Completed
                                      }
                                    />
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          )
                        )}
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            gap: 2,
                            justifyContent: "flex-end",
                          }}
                        >
                          {!formik.values.visitors.some(
                            (visitor: VisitorDetail) =>
                              visitor.status === VisitorStatus.Draft
                          ) &&
                            externalState.visitInvitation.noOfInvitations >
                              formik.values.visitors.length && (
                              <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                  push({
                                    idPassportNumber: "",
                                    fullName: "",
                                    contactNumber: "",
                                    countryCode: "+94",
                                    emailAddress: "",
                                    status: VisitorStatus.Draft,
                                  })
                                }
                              >
                                Add Another Visitor
                              </Button>
                            )}

                          {formik.values.visitors.some(
                            (visitor: VisitorDetail) =>
                              visitor.status === VisitorStatus.Draft
                          ) && (
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<Check />}
                              onClick={() => formik.submitForm()}
                            >
                              Submit Visitor
                            </Button>
                          )}
                        </Box>
                      </Box>
                    )}
                  </FieldArray>
                </Form>
              )}
            </Formik>
          </Container>
        </Box>
      ) : externalState.loading ? (
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          sx={{
            mt: { xs: 6, md: 10 },
            mb: { xs: 3, md: 5 },
            textAlign: "center",
          }}
        >
          <Grid item xs={12} sm={10} md={8} lg={6}>
            <Box>
              <StateWithImage
                message="Something went wrong!"
                imageUrl={require("@assets/images/error.svg").default}
              />
            </Box>
          </Grid>
        </Grid>
      ) : null}
    </>
  );
}

export default VisitorRegisterCard;
