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
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { FishIcon } from "lucide-react";
import { Ham } from "lucide-react";
import { LeafyGreen } from "lucide-react";

import infoIcon from "@assets/images/info-icon.svg";
import ErrorHandler from "@component/common/ErrorHandler";
import PreLoader from "@component/common/PreLoader";

import { useDinnerOnDemand } from "../hooks/useDinnerOnDemand";
import CancelModal from "./CancelModal";
import { MealOptionBox } from "./MealOptionBox";
import { OrderInfoSection } from "./OrderInfo";

const mealOptionsBox = [
  { value: "Chicken", label: "Chicken", icon: <Ham /> },
  { value: "Fish", label: "Fish", icon: <FishIcon /> },
  { value: "Vegetarian", label: "Vegetarian", icon: <LeafyGreen /> },
];

export default function DinnerOnDemand() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    userInfo,
    isUserLoading,
    error,
    isLoading,
    is404,
    formik,
    isFormDisabled,
    mealOptionsDefault,
    orderPlaced,
    isCancelDialogOpen,
    handleOpenCancelDialog,
    handleCloseCancelDialog,
  } = useDinnerOnDemand();

  if (isUserLoading) {
    return <PreLoader isLoading message="Loading user info..." />;
  }

  if (!userInfo) {
    return <ErrorHandler message={"Failed to load user info"} />;
  }

  if (isLoading) {
    return <PreLoader isLoading message="We are getting things ready..." />;
  }

  if (error && !is404) {
    return <ErrorHandler message="Failed to load dinner request" />;
  }

  const handleMealOptionClick = (mealValue: string) => {
    if (isFormDisabled) return;

    const isCurrentlySelected = formik.values.mealOption === mealValue;
    const isOriginallyOrdered = mealOptionsDefault === mealValue;

    if (isCurrentlySelected) {
      if (isOriginallyOrdered && orderPlaced) return;
      formik.setFieldValue("mealOption", null);
    } else {
      formik.setFieldValue("mealOption", mealValue);
    }
  };

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
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Meal Options */}
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                width: "100%",
                gap: 2,
              }}
            >
              {mealOptionsBox.map((meal) => {
                const isUpdatingOrder =
                  orderPlaced && formik.values.mealOption !== mealOptionsDefault;

                return (
                  <MealOptionBox
                    key={meal.value}
                    meal={meal}
                    isSelected={formik.values.mealOption === meal.value}
                    isOrdered={mealOptionsDefault === meal.value && isUpdatingOrder}
                    isDisabled={isFormDisabled}
                    onClick={() => handleMealOptionClick(meal.value)}
                  />
                );
              })}
            </Box>

            {/* Info Message */}
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

            {/* Order Info */}
            {mealOptionsDefault && (
              <OrderInfoSection
                mealType={mealOptionsDefault}
                onCancelClick={handleOpenCancelDialog}
              />
            )}

            {/* Submit Buttons */}
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
