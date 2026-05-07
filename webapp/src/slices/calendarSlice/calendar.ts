// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosError, HttpStatusCode } from "axios";

import { AppConfig } from "@config/config";
import {
  SnackMessage,
  WORKING_HOURS_END,
  WORKING_HOURS_START,
  sliceErrorMessages,
} from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState } from "@slices/store";
import { ApiService } from "@utils/apiService";
import { RequestState } from "@utils/types";
import { getErrorMessage } from "@utils/utils";

export interface MeetingDetails {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export interface BusySlot {
  start: string;
  end: string;
}

export interface CalendarBusy {
  busy: BusySlot[];
}

export interface FreeBusyResponse {
  calendars: Record<string, CalendarBusy>;
  kind: string;
  timeMax: string;
  timeMin: string;
}

export interface CreateMeetingResponse {
  success: boolean;
  meetLink?: string;
  eventId?: string;
  errorMessage?: string;
}

interface MeetingSchedulerState {
  meetingDetails: MeetingDetails;
  freeBusyData: FreeBusyResponse | null;
  availableTimeSlots: TimeSlot[];
  meetingLink: string;
  availabilityStatus: RequestState;
  meetingStatus: RequestState;
}

const initialState: MeetingSchedulerState = {
  meetingDetails: {
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  },
  freeBusyData: null,
  availableTimeSlots: [],
  meetingLink: "",
  availabilityStatus: RequestState.IDLE,
  meetingStatus: RequestState.IDLE,
};

export const checkAvailability = createAsyncThunk(
  "meetingScheduler/checkAvailability",
  async ({ date, signal }: { date: string; signal: AbortSignal }, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.calendar}/busy-times?date=${encodeURIComponent(date)}`,
        { signal },
      );

      if (response.status === HttpStatusCode.Ok || HttpStatusCode.Created) {
        return {
          data: response.data,
          date: date,
        };
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.calendarSlice.fetchCalendar);
      }
    } catch (error) {
      if (error instanceof AxiosError && error.name === "CanceledError") {
        throw error;
      }
      const errorMessage = getErrorMessage(error, SnackMessage.error.f2fCreationError);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const createMeeting = createAsyncThunk(
  "meetingScheduler/createMeeting",
  async (
    {
      parRatingId,
      meetingDetails,
      date,
    }: { parRatingId: number; meetingDetails: MeetingDetails; date: string },
    { dispatch },
  ) => {
    try {
      const response = await ApiService.getInstance().post(
        `${AppConfig.serviceUrls.calendar}/schedule-f2f`,
        {
          ...meetingDetails,
          date,
          parRatingId,
        },
      );

      if (response.status === HttpStatusCode.Created) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.f2fCreated,
            type: "success",
          }),
        );
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.calendarSlice.fetchCalendar);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.f2fCreationError);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

// Helper function to generate available time slots
export function generateAvailableTimeSlots(date: string, freeBusyResponse: any): TimeSlot[] {
  const busySlots: BusySlot[] = [];

  if (freeBusyResponse.calendars) {
    Object.keys(freeBusyResponse.calendars).forEach((email) => {
      const calendarData = freeBusyResponse.calendars[email];
      if (calendarData.busy && Array.isArray(calendarData.busy)) {
        calendarData.busy.forEach((busySlot: BusySlot) => {
          busySlots.push({
            start: new Date(busySlot.start).toISOString(),
            end: new Date(busySlot.end).toISOString(),
          });
        });
      }
    });
  }

  const allPossibleSlots: TimeSlot[] = [];
  const selectedDate = new Date(`${date}T00:00:00`);
  let hour = WORKING_HOURS_START;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-based
  const day = String(today.getDate()).padStart(2, "0");
  const currentDate = `${year}-${month}-${day}`;
  if (date === currentDate) {
    hour = new Date().getHours();
  }
  for (hour; hour <= WORKING_HOURS_END; hour++) {
    for (let minute of [0, 30]) {
      if (hour === WORKING_HOURS_END && minute > 0) {
        continue;
      }

      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, minute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      // Format for display (local time)
      const localHour = slotStart.getHours();
      const localMinute = slotStart.getMinutes();
      const localEndHour = slotEnd.getHours();
      const localEndMinute = slotEnd.getMinutes();

      const startLabel = formatTimeForDisplay(
        localHour.toString().padStart(2, "0"),
        localMinute.toString().padStart(2, "0"),
      );
      const endLabel = formatTimeForDisplay(
        localEndHour.toString().padStart(2, "0"),
        localEndMinute.toString().padStart(2, "0"),
      );

      allPossibleSlots.push({
        start: slotStart.toISOString(), // Store as UTC
        end: slotEnd.toISOString(), // Store as UTC
        label: `${startLabel} - ${endLabel}`,
      });
    }
  }

  const availableSlots: TimeSlot[] = allPossibleSlots.filter((slot) => {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();

    // Check if this slot overlaps with any busy slot
    return !busySlots.some((busySlot) => {
      const busyStart = new Date(busySlot.start).getTime();
      const busyEnd = new Date(busySlot.end).getTime();

      return (
        (slotStart >= busyStart && slotStart < busyEnd) ||
        (slotEnd > busyStart && slotEnd <= busyEnd) ||
        (slotStart <= busyStart && slotEnd >= busyEnd)
      );
    });
  });

  return availableSlots;
}

// Helper function to format time for display
function formatTimeForDisplay(hour: string, minute: string): string {
  let hourInt = parseInt(hour, 10);
  const period = hourInt < 12 ? "AM" : "PM";

  // Convert to 12-hour format
  if (hourInt === 0) {
    hourInt = 12;
  } else if (hourInt > 12) {
    hourInt = hourInt - 12;
  }

  return `${hourInt}:${minute} ${period}`;
}

const calendarSlice = createSlice({
  name: "meetingScheduler",
  initialState,
  reducers: {
    setMeetingDetails: (state, action) => {
      state.meetingDetails = { ...state.meetingDetails, ...action.payload };
    },
    setSelectedTimeSlot: (state, action) => {
      state.meetingDetails.startTime = action.payload.start;
      state.meetingDetails.endTime = action.payload.end;
    },
    resetMeetingState: (state) => {
      state.meetingLink = "";
      state.meetingStatus = RequestState.IDLE;
    },
    resetTimeSlot: (state) => {
      state.meetingDetails.startTime = "";
      state.meetingDetails.endTime = "";
    },
    resetAll: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAvailability.pending, (state) => {
        state.availabilityStatus = RequestState.LOADING;
      })
      .addCase(checkAvailability.fulfilled, (state, action) => {
        state.freeBusyData = action.payload.data;

        if (action.payload.data) {
          state.availableTimeSlots = generateAvailableTimeSlots(
            action.payload.date,
            action.payload.data,
          );
        }

        state.availabilityStatus = RequestState.SUCCEEDED;
        state.meetingDetails.startTime = "";
        state.meetingDetails.endTime = "";
      })
      .addCase(checkAvailability.rejected, (state) => {
        state.availabilityStatus = RequestState.FAILED;
      })

      .addCase(createMeeting.pending, (state) => {
        state.meetingStatus = RequestState.LOADING;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.meetLink) {
          state.meetingLink = action.payload.meetLink;
        }
        state.meetingStatus = RequestState.SUCCEEDED;
      })
      .addCase(createMeeting.rejected, (state) => {
        state.meetingStatus = RequestState.FAILED;
      });
  },
});

export const {
  setMeetingDetails,
  setSelectedTimeSlot,
  resetMeetingState,
  resetTimeSlot,
  resetAll,
} = calendarSlice.actions;

export const selectMeetingDetails = (state: RootState) => state.calendarSlice.meetingDetails;
export const selectFreeBusyData = (state: RootState) => state.calendarSlice.freeBusyData;
export const selectAvailableTimeSlots = (state: RootState) =>
  state.calendarSlice.availableTimeSlots;
export const selectMeetingLink = (state: RootState) => state.calendarSlice.meetingLink;
export const selectAvailabilityStatus = (state: RootState) =>
  state.calendarSlice.availabilityStatus;
export const selectMeetingStatus = (state: RootState) => state.calendarSlice.meetingStatus;

export default calendarSlice.reducer;
