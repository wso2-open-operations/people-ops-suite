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

import { useAppDispatch, useAppSelector } from "@slices/store";
import { useState, useEffect } from "react";
import { useConfirmationModalContext } from "@context/DialogContext";
import { ConfirmationType } from "@/types/types";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  useTheme,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  styled,
  alpha,
} from "@mui/material";
import { Formik, Form } from "formik";
import PersonalInfoStep from "./steps/PersonalInfo";
import JobInfoStep from "./steps/JobInfo";
import ReviewStep from "./steps/Review";
import { Check, ArrowBack, ArrowForward } from "@mui/icons-material";
import { personalInfoValidationSchema } from "./steps/PersonalInfo";
import { jobInfoValidationSchema } from "./steps/JobInfo";
import {
  CreateEmployeeFormValues,
  emptyCreateEmployeeValues,
} from "@root/src/types/types";
import { markAllFieldsTouched } from "@root/src/utils/utils";
import {
  createEmployee,
  CreateEmployeePayload,
  resetCreateEmployeeState,
} from "@slices/employeeSlice/employee";
import { EmployeeFormSteps } from "@root/src/config/constant";

const OrangeConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 18 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(90deg, ${
        theme.palette.secondary.contrastText
      }, ${alpha(theme.palette.secondary.contrastText, 0.5)})`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(90deg, ${theme.palette.secondary.contrastText}, ${
        theme.palette.secondary.contrastText})`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderRadius: 1,
  },
}));

const StepIconRoot = styled("div")<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor:
    theme.palette.mode === "dark" ? theme.palette.grey[700] : "#ccc",
  zIndex: 1,
  color: "#fff",
  width: 32,
  height: 32,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "0.75rem",
  fontWeight: 600,

  ...(ownerState.active && {
    backgroundImage: `linear-gradient(135deg, ${
      theme.palette.secondary.contrastText
    }, ${alpha(theme.palette.secondary.contrastText, 0.8)})`,
    boxShadow: `0 4px 10px 0 ${alpha(
      theme.palette.secondary.contrastText,
      0.3
    )}`,
  }),

  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(135deg, ${
      theme.palette.secondary.contrastText
    }, ${alpha(theme.palette.secondary.contrastText, 0.8)})`,
  }),
}));

function CustomStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props;

  return (
    <StepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check sx={{ fontSize: 20 }} /> : icon}
    </StepIconRoot>
  );
}

export default function Employees() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { showConfirmation } = useConfirmationModalContext();
  const [activeStep, setActiveStep] = useState(0);
  const { state: createState } = useAppSelector((s) => s.employee);
  const initialValues = emptyCreateEmployeeValues;
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    dispatch(resetCreateEmployeeState());
    return () => {
      dispatch(resetCreateEmployeeState());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(resetCreateEmployeeState());
  }, [activeStep, dispatch]);

  const handleFormSubmit = (
    formData: CreateEmployeePayload,
    resetForm: () => void
  ) => {
    showConfirmation(
      "Confirm Employee Creation",
      "Are you sure you want to create this employee?",
      ConfirmationType.accept,
      async () => {
        const resultAction = await dispatch(createEmployee(formData));
        if (createEmployee.fulfilled.match(resultAction)) {
          resetForm();
          dispatch(resetCreateEmployeeState());
          setActiveStep(0);
          setFormKey((prev) => prev + 1);
        }
      },
      "Confirm",
      "Cancel"
    );
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <PersonalInfoStep />;
      case 1:
        return <JobInfoStep />;
      case 2:
        return <ReviewStep />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 2.5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Paper
        sx={{
          p: { xs: 1.5, sm: 3, md: 4 },
          width: "100%",
          maxWidth: 1600,
          borderRadius: 3,
          boxShadow: 2,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Add Employee
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            Complete the steps below to add a new employee to the system
          </Typography>
        </Box>

        <Stepper
          activeStep={activeStep}
          alternativeLabel
          connector={<OrangeConnector />}
          sx={{
            mb: 2,
            py: 0.5,
          }}
        >
          {EmployeeFormSteps.map((label) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={CustomStepIcon}
                sx={{
                  "& .MuiStepLabel-label": {
                    mt: 0.5,
                    fontSize: "0.85rem",
                    fontWeight: 400,
                  },
                  "& .MuiStepLabel-label.Mui-active": {
                    color: "secondary.contrastText",
                    fontWeight: 400,
                    fontSize: "0.85rem",
                  },
                  "& .MuiStepLabel-label.Mui-completed": {
                    fontWeight: 600,
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Formik
          key={formKey}
          initialValues={initialValues}
          validationSchema={
            activeStep === 0
              ? personalInfoValidationSchema
              : activeStep === 1
              ? jobInfoValidationSchema
              : undefined
          }
          onSubmit={async (values: CreateEmployeeFormValues, actions) => {
            if (activeStep === EmployeeFormSteps.length - 1) {
              const payload: CreateEmployeePayload = {
                firstName: values.personalInfo.firstName || "",
                lastName: values.personalInfo.lastName || "",
                epf: values.epf || undefined,
                secondaryJobTitle: values.secondaryJobTitle || "",
                employmentLocation: values.employmentLocation,
                workLocation: values.workLocation,
                workEmail: values.workEmail,
                workPhoneNumber: values.workPhoneNumber || undefined,
                startDate: values.startDate,
                managerEmail: values.managerEmail,
                additionalManagerEmails: values.additionalManagerEmail?.length
                  ? values.additionalManagerEmail
                  : [],
                employeeStatus: "Active",
                probationEndDate: values.probationEndDate || undefined,
                agreementEndDate: values.agreementEndDate || undefined,
                employmentTypeId:
                  values.employmentTypeId && values.employmentTypeId > 0
                    ? values.employmentTypeId
                    : undefined,
                designationId: values.designationId,
                officeId: values.officeId,
                teamId: values.teamId,
                subTeamId:
                  values.subTeamId && values.subTeamId > 0
                    ? values.subTeamId
                    : undefined,
                businessUnitId: values.businessUnitId,
                unitId:
                  values.unitId && values.unitId > 0
                    ? values.unitId
                    : undefined,
                continuousServiceRecord:
                  values.continuousServiceRecord || undefined,
                personalInfo: {
                  nicOrPassport: values.personalInfo.nicOrPassport,
                  fullName: values.personalInfo.fullName,
                  nameWithInitials:
                    values.personalInfo.nameWithInitials || undefined,
                  firstName: values.personalInfo.firstName || undefined,
                  lastName: values.personalInfo.lastName || undefined,
                  title: values.personalInfo.title || undefined,
                  dob: values.personalInfo.dob || undefined,
                  personalEmail: values.personalInfo.personalEmail || undefined,
                  personalPhone: values.personalInfo.personalPhone || undefined,
                  residentNumber:
                    values.personalInfo.residentNumber || undefined,
                  addressLine1: values.personalInfo.addressLine1 || undefined,
                  addressLine2: values.personalInfo.addressLine2 || undefined,
                  city: values.personalInfo.city || undefined,
                  stateOrProvince:
                    values.personalInfo.stateOrProvince || undefined,
                  postalCode: values.personalInfo.postalCode || undefined,
                  country: values.personalInfo.country || undefined,
                  nationality: values.personalInfo.nationality || undefined,
                  emergencyContacts: values.personalInfo.emergencyContacts,
                },
              };
              try {
                handleFormSubmit(payload, actions.resetForm);
                actions.setSubmitting(false);
              } catch (error) {
                console.error("Failed to create employee:", error);
                actions.setSubmitting(false);
              }
            } else {
              handleNext();
              actions.setSubmitting(false);
            }
          }}
          validateOnChange={false}
          validateOnBlur={true}
        >
          {({ isSubmitting, validateForm, setTouched, submitForm }) => (
            <Form
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
            >
              {renderStepContent(activeStep)}
              <Box
                mt={3}
                width="100%"
                display="flex"
                justifyContent="flex-end"
                gap={2}
              >
                {activeStep > 0 && (
                  <Button
                    startIcon={<ArrowBack />}
                    sx={{ textTransform: "none" }}
                    variant="outlined"
                    color="primary"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                )}
                <Button
                  endIcon={
                    activeStep === EmployeeFormSteps.length - 1 ? null : (
                      <ArrowForward />
                    )
                  }
                  sx={{ textTransform: "none" }}
                  variant="contained"
                  color="secondary"
                  type="button"
                  disabled={isSubmitting || createState === "loading"}
                  onClick={async () => {
                    const errors = await validateForm();
                    if (Object.keys(errors).length === 0) {
                      if (activeStep === EmployeeFormSteps.length - 1) {
                        submitForm();
                      } else {
                        handleNext();
                      }
                    } else {
                      setTouched(markAllFieldsTouched(errors));
                    }
                  }}
                >
                  {createState === "loading"
                    ? "Submitting..."
                    : activeStep === EmployeeFormSteps.length - 1
                    ? "Submit"
                    : "Next"}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
}
