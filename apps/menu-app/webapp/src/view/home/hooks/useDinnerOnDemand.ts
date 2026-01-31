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
import { useFormik } from "formik";

import { useMemo, useState } from "react";

import { DinnerRequest, MealOption } from "@/types/types";
import { useGetDinnerRequestQuery, useSubmitDinnerRequestMutation } from "@services/dod.api";
import { useGetUserInfoQuery } from "@services/user.api";

export const useDinnerOnDemand = () => {
  const { data: userInfo, isLoading: isUserLoading } = useGetUserInfoQuery();
  const [submitDinner] = useSubmitDinnerRequestMutation();
  const { data: dinner, error, isLoading } = useGetDinnerRequestQuery();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);

  const isDodTimeActive = useMemo(() => {
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(16, 0, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(19, 0, 0, 0);
    return now >= startTime && now <= endTime;
  }, []);

  const is404 = error && "status" in error && error.status === 404;
  const mealOptionsDefault: MealOption | null = is404 ? null : dinner?.mealOption || null;
  const orderPlaced = mealOptionsDefault !== null;

  const formik = useFormik({
    initialValues: { mealOption: mealOptionsDefault },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        if (!values?.mealOption) return;
        if (!userInfo) return;

        const date = new Date().toLocaleDateString("en-CA");

        const submitPayload: DinnerRequest = {
          id: dinner?.id,
          mealOption: values.mealOption,
          date: date,
          department: userInfo.department,
          team: userInfo.team,
          managerEmail: userInfo.managerEmail,
        };

        await submitDinner(submitPayload);
      } catch (error) {
        console.error("Failed to submit dinner request:", error);
      }
    },
  });

  const isFormDisabled = formik.isSubmitting || !isDodTimeActive;

  const handleOpenCancelDialog = () => {
    setIsCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setIsCancelDialogOpen(false);
  };

  return {
    userInfo,
    isUserLoading,
    dinner,
    error,
    isLoading,
    is404,
    formik,
    isDodTimeActive,
    isFormDisabled,
    mealOptionsDefault,
    orderPlaced,
    isCancelDialogOpen,
    handleOpenCancelDialog,
    handleCloseCancelDialog,
  };
};
