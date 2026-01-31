// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Box,
  Grid,
  Alert,
  Paper,
  Select,
  Button,
  MenuItem,
  Container,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  CircularProgress,
  SelectChangeEvent,
  IconButton,
} from "@mui/material";
import {
  resetAll,
  TimeSlot,
  createMeeting,
  resetTimeSlot,
  checkAvailability,
  setMeetingDetails,
  selectMeetingLink,
  setSelectedTimeSlot,
  selectMeetingStatus,
  selectMeetingDetails,
  selectAvailableTimeSlots,
  selectAvailabilityStatus,
} from "@slices/calendarSlice";
import { useDispatch } from "react-redux";
import { RequestState } from "@utils/types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AppDispatch, useAppSelector, RootState } from "@slices/store";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import {
  VideoCall,
  Description,
  CalendarMonth,
  AccessTime,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";

interface MeetingSchedulerPageProps {
  parRatingId: number;
  onClose: () => void;
}

const MeetingSchedulerPage: React.FC<MeetingSchedulerPageProps> = ({
  parRatingId,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const meetingLink = useAppSelector(selectMeetingLink);
  const meetingStatus = useAppSelector(selectMeetingStatus);
  const meetingDetails = useAppSelector(selectMeetingDetails);
  const abortController = useRef<AbortController | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const availableTimeSlots = useAppSelector(selectAvailableTimeSlots);
  const availabilityStatus = useAppSelector(selectAvailabilityStatus);
  const meeting = useAppSelector(
    (state: RootState) => state.calendarSlice.meetingStatus
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isCheckingAvailability = availabilityStatus === RequestState.LOADING;
  const isCreatingMeeting = meetingStatus === RequestState.LOADING;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    dispatch(setMeetingDetails({ [name]: value }));
  };

  const checkAvailabilityForDate = useCallback(
    (date: string) => {
      setValidationError("");

      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      dispatch(
        checkAvailability({
          date: date,
          signal: abortController.current.signal,
        })
      );
    },
    [dispatch]
  );

  const handleDateChange = (newValue: Date | null) => {
    if (newValue) {
      const year = newValue.getFullYear();
      const month = String(newValue.getMonth() + 1).padStart(2, "0");
      const day = String(newValue.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      setSelectedDate(formattedDate);

      dispatch(resetTimeSlot());

      checkAvailabilityForDate(formattedDate);
    }
  };

  // Handle time slot selection
  const handleTimeSlotChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    if (value) {
      const [start, end] = value.split("|");
      dispatch(setSelectedTimeSlot({ start, end }));
    }
  };

  const handleCreateMeeting = useCallback(async () => {
    setValidationError("");

    if (!meetingDetails.title) {
      setValidationError("Please enter a meeting title");
      return;
    }
    if (!meetingDetails.startTime || !meetingDetails.endTime) {
      setValidationError("Please select a time slot");
      return;
    }

    await dispatch(
      createMeeting({
        parRatingId: parRatingId,
        meetingDetails,
        date: selectedDate ?? "",
      })
    );
  }, [dispatch, meetingDetails, selectedDate]);

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      dispatch(resetAll());
    };
  }, [dispatch]);

  useEffect(() => {
    if (meeting === RequestState.SUCCEEDED) {
      onClose();
    }
  }, [meeting]);

  // Get time slot value for select component
  const getTimeSlotValue = (slot: TimeSlot): string => {
    return `${slot.start}|${slot.end}`;
  };

  // Get the currently selected time slot value
  const getSelectedTimeSlotValue = (): string => {
    if (meetingDetails.startTime && meetingDetails.endTime) {
      return `${meetingDetails.startTime}|${meetingDetails.endTime}`;
    }
    return "";
  };

  // Convert selected date string to Date object for DatePicker
  const getSelectedDateObject = (): Date | null => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box p={2}>
          {/* Close Button */}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <VideoCall sx={{ mr: 2 }} />
            Schedule a Google Meet
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DatePicker
                  minDate={new Date()}
                  label="Select Date"
                  value={getSelectedDateObject()}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
                {isCheckingAvailability && (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Checking availability...
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>

            {availableTimeSlots.length > 0 && (
              <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <CalendarMonth sx={{ mr: 1 }} />
                  Available Time Slots
                </Typography>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="time-slot-select-label">
                    Select a Time Slot
                  </InputLabel>
                  <Select
                    labelId="time-slot-select-label"
                    id="time-slot-select"
                    value={getSelectedTimeSlotValue()}
                    label="Select a Time Slot"
                    onChange={handleTimeSlotChange}
                    startAdornment={<AccessTime sx={{ mr: 1, ml: -0.5 }} />}
                  >
                    {availableTimeSlots.map((slot, index) => (
                      <MenuItem key={index} value={getTimeSlotValue(slot)}>
                        {slot.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            )}

            {availabilityStatus === RequestState.SUCCEEDED &&
              availableTimeSlots.length === 0 && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  No available time slots found. Both participants might be busy
                  on this date.
                </Alert>
              )}

            {meetingDetails.startTime && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Meeting Details
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Meeting Title"
                      name="title"
                      value={meetingDetails.title}
                      onChange={handleInputChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <Description
                            sx={{ mr: 1, color: "text.secondary" }}
                          />
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={meetingDetails.description || ""}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {validationError && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {validationError}
              </Alert>
            )}

            {availabilityStatus === RequestState.FAILED && (
              <Alert severity="error" sx={{ mt: 3 }}>
                Failed to check calendar availability. Please try again.
              </Alert>
            )}

            {meetingStatus === RequestState.FAILED && (
              <Alert severity="error" sx={{ mt: 3 }}>
                Failed to create the meeting. Please try again.
              </Alert>
            )}

            {meetingLink && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Meeting created successfully!
                </Typography>
                <Typography variant="body2">
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: "bold" }}
                  >
                    Click here to open Google Meet link
                  </a>
                </Typography>
              </Alert>
            )}

            {meetingDetails.startTime && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleCreateMeeting}
                disabled={isCreatingMeeting || !meetingDetails.title}
                startIcon={
                  isCreatingMeeting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <VideoCall />
                  )
                }
                sx={{ mt: 4 }}
              >
                {isCreatingMeeting ? "Creating..." : "Schedule Meeting"}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default MeetingSchedulerPage;
