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
}

const initialState: SubmitVisitState = {
  state: State.idle,
  submitState: State.idle,
  stateMessage: "",
  error: null,
  data: null,
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

const submitVisitSlice = createSlice({
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
      });
  },
});

export const { resetSubmitState } = submitVisitSlice.actions;
export default submitVisitSlice.reducer;
