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

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import axios, { HttpStatusCode } from "axios";
import { APIService } from "@utils/apiService";
import { SnackMessage } from "@config/constant";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { BUAccessLevel, PromotionRequest, Role, User } from "@root/src/utils/types";

interface UserManagementState {
  userState: State;
  deleteState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  users: User[] | null;
  businessUnits: BUAccessLevel[] | null,
}

export interface UpdateUser {
  id: number;
  email?: string;
  roles?: Role[];
  functionalLeadAccessLevels?: {
    businessUnits: BUAccessLevel[];
  } | null;
  active?: boolean;
}

export interface UserInsertInterface {
  email: string;
  roles: Role[];
  functionalLeadAccessLevels?: {
    businessUnits: BUAccessLevel[];
  } | null;
}

const initialState: UserManagementState = {
  userState: State.idle,
  deleteState: State.idle,
  stateMessage: null,
  errorMessage: null,
  businessUnits: null,
  users: null
};

export const fetchAllUsers = createAsyncThunk(
  "userManagement/fetchAllUsers",
  async (_,{ dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<User[]>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.user, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve(response.data.users);
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? SnackMessage.error.fetchEmployeeHistory
                  : "An unknown error occurred.",
                type: "error",
              })
            );
          reject(error.response?.data?.message);
        });
    });
  }

);

export const updateUser = createAsyncThunk(
  "userManagement/updateUser",
  async (payload: UpdateUser,
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken(); 
    return new Promise<{ status: string }>((resolve, reject) => {
      APIService.getInstance()
        .patch(AppConfig.serviceUrls.user, payload,{
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            status: response.data
          })
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully Updated the User!",
              type: "success",
            })
          );
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? "Failed to Update the User!"
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

export const fetchAllBUs = createAsyncThunk(
  "userManagement/fetchAllBUs",
  async (_,{ dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<BUAccessLevel[]>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.getBUs, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          console.log(response.data.businessUnits);
          resolve(response.data.businessUnits);
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? SnackMessage.error.fetchEmployeeHistory
                  : "An unknown error occurred.",
                type: "error",
              })
            );
          reject(error.response?.data?.message);
        });
    });
  }
);

export const insertUser = createAsyncThunk(
  "userManagement/insertUser",
  async (payload: UserInsertInterface,
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken(); 
    return new Promise<{ status: string }>((resolve, reject) => {
      APIService.getInstance()
        .post(AppConfig.serviceUrls.user, payload,{
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            status: response.data
          })
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully Create a User!",
              type: "success",
            })
          );
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? "Failed to Create a User!"
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

export const deleteUser = createAsyncThunk(
  "userManagement/deleteUser",
  async ({
      id,
    }: {
      id: number;
    }, { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<{ status: string }>((resolve, reject) => {
      APIService.getInstance()
        .delete(AppConfig.serviceUrls.user + "/" + id, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
              status: response.data,
          });
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully Deleted the user!",
              type: "success",
            })
          );
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? "Failed to Deleted the user."
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

const UserManagementSlice = createSlice({
  name: "UserManagement",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.userState = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.userState = State.loading;
        state.stateMessage = "Fetching users data...";
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.userState = State.success;
        state.stateMessage = "Successfully fetched!";
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state) => {
        state.userState = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(updateUser.pending, (state) => {
        state.userState = State.loading;
        state.stateMessage = "Updating users data...";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.userState = State.success;
        state.stateMessage = "Successfully Updated!";
      })
      .addCase(updateUser.rejected, (state) => {
        state.userState = State.failed;
        state.stateMessage = "Failed to Update!";
      })
      .addCase(fetchAllBUs.pending, (state) => {
        state.userState = State.loading;
        state.stateMessage = "Fetching BU data...";
      })
      .addCase(fetchAllBUs.fulfilled, (state, action) => {
        state.userState = State.success;
        state.businessUnits = action.payload;
        state.stateMessage = "Successfully fetched!";
      })
      .addCase(fetchAllBUs.rejected, (state) => {
        state.userState = State.failed;
        state.stateMessage = "Failed to fetched!";
      })
      .addCase(deleteUser.pending, (state) => {
        state.deleteState = State.loading;
        state.stateMessage = "Deleting the user...";
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteState = State.success;
        state.stateMessage = "Successfully Deleted the User!";
      })
      .addCase(deleteUser.rejected, (state) => {
        state.deleteState = State.failed;
        state.stateMessage = "Failed to Delete the User!";
      });
  },
});

export const { resetSubmitState } = UserManagementSlice.actions;
export default UserManagementSlice.reducer;
