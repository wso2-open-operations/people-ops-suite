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
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useFormik } from "formik";
import { FishIcon } from "lucide-react";
import { Ham } from "lucide-react";
import { LeafyGreen } from "lucide-react";

import { useMemo, useState } from "react";

import { DinnerRequest, MealOption } from "@/types/types";
import infoIcon from "@assets/images/info-icon.svg";
import ErrorHandler from "@root/src/component/common/ErrorHandler";
import PreLoader from "@root/src/component/common/PreLoader";
import { useGetDinnerRequestQuery, useSubmitDinnerRequestMutation } from "@services/dod.api";
import { userApi } from "@services/user.api";
import { useAppSelector } from "@slices/store";

import CancelModal from "./CancelModal";

const mealOptionsBox = [
  { value: "Chicken", label: "Chicken", icon: <Ham /> },
  { value: "Fish", label: "Fish", icon: <FishIcon /> },
  { value: "Vegetarian", label: "Vegetarian", icon: <LeafyGreen /> },
];

export default function DinnerOnDemand() {
  const theme = useTheme();

  const { data: dinner, error, isLoading } = useGetDinnerRequestQuery();
  const [submitDinner] = useSubmitDinnerRequestMutation();

  const usersState = useAppSelector((state) => userApi.endpoints.getUserInfo.select()(state));
  const user = usersState.data;

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
        if (!user) return;

        const date = new Date().toLocaleDateString("en-CA");

        const submitPayload: DinnerRequest = {
          mealOption: values.mealOption,
          date: date,
          department: user.department,
          team: user.team,
          managerEmail: user.managerEmail,
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

  if (!user) {
    return <ErrorHandler message={"Failed to load user info"} />;
  }

  if (isLoading) {
    return <PreLoader isLoading message="Getting things ready" />;
  }

  if (error && !is404) {
    return <ErrorHandler message="Failed to load dinner request" />;
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6" sx={{ color: theme.palette.customText.primary.p1.active }}>
          Dinner On Demand
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.customText.primary.p2.active, fontWeight: 500 }}
          >
            Select a meal option
          </Typography>

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Box sx={{ display: "flex", gap: 2 }}>
              {mealOptionsBox.map((meal) => (
                <Box
                  key={meal.value}
                  onClick={() => !isFormDisabled && formik.setFieldValue("mealOption", meal.value)}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    border: `1px solid ${
                      formik.values.mealOption === meal.value
                        ? theme.palette.customBorder.secondary.active
                        : theme.palette.customBorder.territory.active
                    }`,
                    p: 2,
                    borderRadius: 1,
                    color: theme.palette.customText.primary.p2.active,
                    backgroundColor:
                      formik.values.mealOption === meal.value
                        ? theme.palette.fill.secondary_light.active
                        : theme.palette.surface.secondary.active,
                    "&:hover": {
                      border:
                        formik.values.mealOption !== meal.value
                          ? `1px solid ${theme.palette.customBorder.primary.active}`
                          : undefined,
                    },
                    opacity: isFormDisabled ? 0.5 : 1,
                    cursor: isFormDisabled ? "not-allowed" : "pointer",
                    pointerEvents: isFormDisabled ? "none" : "auto",
                  }}
                >
                  <Typography variant="body1">{meal.label}</Typography>
                  {meal.icon}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Box
                component="img"
                src={infoIcon}
                alt="info"
                sx={{
                  width: 16,
                  height: 16,
                  alignItems: "center",
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: theme.palette.customText.primary.p3.active }}
              >
                Dinner request option is only available from <strong>04:00pm till 07:00pm</strong>{" "}
                for the given day.
              </Typography>
            </Box>

            {mealOptionsDefault && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.customText.primary.p3.active }}
                >
                  You’ve successfully ordered a{" "}
                  <Box
                    component={"span"}
                    sx={{ color: theme.palette.customText.primary.p1.active }}
                  >
                    {mealOptionsDefault} meal
                  </Box>{" "}
                  for dinner and you can collect it from ground floor.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.customText.primary.p3.active }}
                >
                  To update the meal{" "}
                  <Box
                    component={"span"}
                    sx={{ color: theme.palette.customText.primary.p1.active }}
                  >
                    choose different meal option and submit.
                  </Box>{" "}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.customText.primary.p3.active }}
                >
                  To Cancel the order click{" "}
                  <Box
                    component="span"
                    onClick={handleOpenCancelDialog}
                    role="button"
                    sx={{
                      color: "#CC5500",
                      cursor: "pointer",
                      textDecoration: "underline",
                      "&:hover": {
                        fontWeight: 600,
                      },
                    }}
                  >
                    Cancel
                  </Box>
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={
                isFormDisabled ||
                !formik.values.mealOption ||
                (orderPlaced && formik.values.mealOption === mealOptionsDefault)
              }
              sx={{
                px: 2,
                py: 1,
                backgroundColor: theme.palette.fill.primary.active,
                boxShadow: "none",
                width: "fit-content",
                "&:hover": {
                  backgroundColor: theme.palette.fill.primary.active,
                  boxShadow: "none",
                },
              }}
            >
              {orderPlaced
                ? formik.isSubmitting
                  ? "Updating Dinner"
                  : "Update Dinner"
                : formik.isSubmitting
                  ? "Ordering Dinner"
                  : "Order Dinner"}
            </Button>
          </Box>
        </Box>
      </Box>

      <CancelModal
        handleCloseModal={handleCloseCancelDialog}
        isCancelDialogOpen={isCancelDialogOpen}
      />
    </>
  );
}
