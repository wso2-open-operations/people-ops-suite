// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useEffect, useState } from "react";
import {
  Alert,
  AlertColor,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import {
  fetchParRatingOfEmployee,
  selectEmployeeRatings,
  selectEmployeeRatingStatus,
  updateParRatingOfEmployee,
  updateSelectedParF2fFields,
} from "@slices/employeeSlice";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  ParCycle,
  ParF2fStatus,
  ParLeadStatus,
  RequestState,
} from "@utils/types";
import { useFormik } from "formik";
import * as yup from "yup";
import { LoadingEffect } from "@components/ui/Loading";
import { shortDateFormat, snackMessages, uiMessages } from "@config/constant";
import { showSnackBarMessage } from "@slices/commonSlice/common";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import LoadingButton from "@mui/lab/LoadingButton";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import MeetingSchedulerPage from "@components/common/ScheduleF2F";
import { CustomModal } from "./CustomModal";
dayjs.extend(utc);

interface F2fPanelProp {
  employeeId: string;
  parCycle: Partial<ParCycle>;
  isEmployeeView?: boolean;
}

export const F2fPanel = ({
  employeeId,
  parCycle,
  isEmployeeView,
}: F2fPanelProp) => {
  const dispatch = useAppDispatch();
  const parRating = useAppSelector(selectEmployeeRatings);
  const employeeParRatingLoading = useAppSelector(selectEmployeeRatingStatus);
  const [feedbackRequestModalOpen, setFeedbackRequestModalOpen] =
    useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  const handleOpenFeedbackRequestModal = () =>
    setFeedbackRequestModalOpen(true);
  const handleCloseFeedbackRequestModal = () => {
    setFeedbackRequestModalOpen(false);
    if (parCycle?.parCycleId) {
      const updateF2fStatus = async () => {
        const resultAction = await dispatch(
          fetchParRatingOfEmployee({
            employeeId,
            parCycleId: parCycle.parCycleId!,
          })
        );

        if (fetchParRatingOfEmployee.fulfilled.match(resultAction)) {
          setFieldValue(
            "parF2fDate",
            dayjs(resultAction.payload.parF2fDate).format("YYYY-MM-DD")
          );
        }
      };

      updateF2fStatus();
    }
  };

  useEffect(() => {
    const deadlineLocal = dayjs(parCycle.parF2FDeadline).endOf("day");
    setIsDeadlinePassed(dayjs().isAfter(deadlineLocal));
  }, [parCycle]);

  const validationSchema = yup.object().shape({
    parF2fDate: yup.date().required("Required"),
  });

  const {
    values,
    errors,
    setFieldValue,
    handleBlur,
    handleSubmit,
    touched,
    isSubmitting,
  } = useFormik({
    initialValues: {
      parF2fDate: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const selectedDate = dayjs(values.parF2fDate).format("YYYY-MM-DD");
      const resultAction = await dispatch(
        updateParRatingOfEmployee({
          employeeId,
          parCycleId: parCycle.parCycleId,
          parRatingId: parRating?.parRatingId,
          values: {
            parF2fStatus: ParF2fStatus.COMPLETED,
            parF2fDate: selectedDate,
          },
        })
      );

      if (updateParRatingOfEmployee.fulfilled.match(resultAction)) {
        dispatch(
          updateSelectedParF2fFields({
            parF2fStatus: ParF2fStatus.COMPLETED,
            parF2fDate: selectedDate,
          })
        );
        dispatch(
          showSnackBarMessage(snackMessages.success.updateF2fStatus, "success")
        );
      }
    },
  });

  useEffect(() => {
    if (parCycle?.parCycleId) {
      const updateF2fStatus = async () => {
        const resultAction = await dispatch(
          fetchParRatingOfEmployee({
            employeeId,
            parCycleId: parCycle.parCycleId!,
          })
        );

        if (fetchParRatingOfEmployee.fulfilled.match(resultAction)) {
          setFieldValue(
            "parF2fDate",
            dayjs(resultAction.payload.parF2fDate).format("YYYY-MM-DD")
          );
        }
      };

      updateF2fStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, parCycle.parCycleId, setFieldValue]);

  const renderAlert = (
    severity: AlertColor,
    message: string,
    iconColor: string
  ) => (
    <Alert
      severity={severity}
      sx={{
        marginBottom: 2,
        "& .MuiAlert-icon": {
          color: iconColor,
        },
      }}
    >
      {message}
    </Alert>
  );

  const renderF2fDatePicker = () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          mt: 2,
          mb: 3,
          gap: 2,
        }}
      >
        <Typography
          sx={{
            mr: { sm: 3 },
            fontWeight: "medium",
            width: "20%",
          }}
        >
          F2F Completed Date:
        </Typography>
        <DatePicker
          disabled={parRating?.parLeadStatus !== ParLeadStatus.SHARED}
          value={values.parF2fDate}
          onChange={(newValue) => {
            setFieldValue(
              "parF2fDate",
              dayjs(newValue?.toString()).format("YYYY-MM-DD")
            );
          }}
          maxDate={dayjs().toDate()}
          minDate={dayjs(parCycle?.parCycleStartDate).toDate()}
          renderInput={(params) => (
            <TextField
              aria-label="par f2f date"
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
              {...params}
              name="parF2fDate"
              onBlur={handleBlur}
              error={touched.parF2fDate && Boolean(errors.parF2fDate)}
              helperText={touched.parF2fDate && errors.parF2fDate}
            />
          )}
        />
      </Box>
    </LocalizationProvider>
  );

  const renderActions = () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        mt: 4,
        gap: 2,
      }}
    >
      {parRating?.parF2fStatus === ParF2fStatus.PENDING && (
        <Button
          onClick={handleOpenFeedbackRequestModal}
          variant="outlined"
          disabled={
            parRating?.parLeadStatus !== ParLeadStatus.SHARED || !isEmployeeView
          }
        >
          Schedule Google Meet
        </Button>
      )}
      <LoadingButton
        disabled={parRating?.parLeadStatus !== ParLeadStatus.SHARED}
        type="submit"
        loading={isSubmitting}
        variant={isSubmitting ? "outlined" : "contained"}
      >
        Mark as completed
      </LoadingButton>
    </Box>
  );

  return (
    <>
      {employeeParRatingLoading === RequestState.LOADING && (
        <LoadingEffect message={uiMessages.loading.pageLoading} />
      )}
      {employeeParRatingLoading === RequestState.SUCCEEDED && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            pr: 3,
            pl: 3,
            backgroundColor: "background.paper",
            borderRadius: 2,
            "& .MuiAlert-root": {
              marginBottom: 2,
            },
            height: "100%",
          }}
        >
          {!isDeadlinePassed &&
            parRating.parF2fStatus === ParF2fStatus.SCHEDULED &&
            renderAlert("success", `F2F meeting is scheduled`, "info.main")}

          {isDeadlinePassed &&
            parRating.parF2fStatus !== ParF2fStatus.COMPLETED &&
            renderAlert(
              "error",
              `The deadline for updating the F2F has passed on ${dayjs
                .utc(parCycle.parF2FDeadline)
                .format("D MMM 'YY")}`,
              "error.main"
            )}

          {!isDeadlinePassed &&
            parRating.parF2fStatus !== ParF2fStatus.COMPLETED &&
            renderAlert(
              "info",
              `Please complete your F2F meeting before the deadline : ${dayjs
                .utc(parCycle.parF2FDeadline)
                .format("D MMM 'YY")}`,
              "info.main"
            )}

          {parRating.parLeadStatus !== ParLeadStatus.SHARED &&
            !isDeadlinePassed &&
            renderAlert("info", uiMessages.alert.f2fDisabled, "info.main")}

          {parRating.parF2fStatus === ParF2fStatus.COMPLETED &&
            renderAlert(
              "success",
              `${uiMessages.alert.f2fCompleted} ${dayjs(
                parRating.parF2fDate
              ).format(shortDateFormat)}`,
              "success.main"
            )}

          {parRating.parF2fStatus !== ParF2fStatus.COMPLETED &&
            !isDeadlinePassed &&
            renderF2fDatePicker()}

          {parRating.parF2fStatus !== ParF2fStatus.COMPLETED &&
            !isDeadlinePassed &&
            renderActions()}

          <CustomModal
            open={feedbackRequestModalOpen}
            onClose={handleCloseFeedbackRequestModal}
          >
            {feedbackRequestModalOpen && (
              <MeetingSchedulerPage
                parRatingId={parRating.parRatingId}
                onClose={handleCloseFeedbackRequestModal}
              />
            )}
          </CustomModal>
        </Box>
      )}
    </>
  );
};
