import { createAsyncThunk } from "@reduxjs/toolkit";
// import { VisitorDetail } from "@root/src/types/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "../../types/types";

interface VisitData {
  visitors: Array<any>;
}

interface SubmitVisitState {
  state: State;
  submitState: State;
  stateMessage: string;
  error: string | null;
  data: any;
  visitInvitation: any | null;
}

const initialState: SubmitVisitState = {
  state: State.idle,
  submitState: State.idle,
  stateMessage: "",
  error: null,
  data: null,
  visitInvitation: null,
};

export const submitVisitAsync = createAsyncThunk(
  "visit/submitVisit",
  async (visitData: VisitData, { rejectWithValue }) => {
    try {
      // Simulate API call to submit visit data
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data: visitData });
        }, 1000);
      });

      return response;
    } catch (error) {
      return rejectWithValue("Failed to submit visit");
    }
  }
);

export const getVisitInvitationAsync = createAsyncThunk(
  "visit/getVisitInvitation",
  async (invitationId: string, { rejectWithValue }) => {
    try {
      const staticVisitData = {
        id: "2",
        companyName: "test",
        purposeOfVisit: "Test visit",
        accessibleLocations: [{ floor: "11th Floor", rooms: [] }],
        timeOfEntry: "2025-09-24 09:30:00",
        timeOfDeparture: "2025-09-24 10:30:00",
        status: "ACCEPTED",
      };
      // Simulate API call to get visit invitation details
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data: staticVisitData });
        }, 3000);
      });
      return response;
    } catch (error) {
      return rejectWithValue("Failed to fetch visit invitation");
    }
  }
);

const externalSlice = createSlice({
  name: "submitVisit",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.submitState = State.idle;
      state.error = null;
      state.stateMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitVisitAsync.pending, (state) => {
        state.submitState = State.loading;
        state.stateMessage = "Submitting visit...";
        state.error = null;
      })
      .addCase(
        submitVisitAsync.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.submitState = State.success;
          state.stateMessage = "Visit submitted successfully";
          state.data = action.payload.data;
          state.error = null;
        }
      )
      .addCase(submitVisitAsync.rejected, (state, action) => {
        state.submitState = State.failed;
        state.stateMessage = "Failed to submit visit";
        state.error = action.payload as string;
      })
      .addCase(getVisitInvitationAsync.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching invitation...";
        state.error = null;
      })
      .addCase(
        getVisitInvitationAsync.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.state = State.success;
          state.stateMessage = "Invitation fetched successfully";
          state.visitInvitation = action.payload.data;
          state.error = null;
        }
      )
      .addCase(getVisitInvitationAsync.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch invitation";
        state.error = action.payload as string;
      });
  },
});

export const { resetSubmitState } = externalSlice.actions;
export default externalSlice.reducer;
