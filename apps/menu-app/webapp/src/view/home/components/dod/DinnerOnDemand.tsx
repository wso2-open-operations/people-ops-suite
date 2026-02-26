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
import Lottie from "lottie-react";
import { FishIcon } from "lucide-react";
import { Ham } from "lucide-react";
import { LeafyGreen } from "lucide-react";

import emptyLogo from "@assets/animations/clock-time.json";
import ErrorHandler from "@component/common/ErrorHandler";
import BackdropProgress from "@component/ui/BackdropProgress";
import { useRecolorLottie } from "@hooks/useRecolorLottie";
import { useDinnerOnDemand } from "@view/home/hooks/useDinnerOnDemand";

import CancelModal from "./CancelModal";
import DodInfoMessage from "./DodInfoMessage";
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
    isDodTimeActive,
    isFormDisabled,
    mealOptionsDefault,
    orderPlaced,
    isCancelDialogOpen,
    handleOpenCancelDialog,
    handleCloseCancelDialog,
  } = useDinnerOnDemand();

  const logoStyle = {
    height: "150px",
  };

  const coloredLogo = useRecolorLottie(emptyLogo, {
    "#020F30": theme.palette.customText.primary.p2.active,
    "#F57800": "F57800",
  });

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

  if (isUserLoading || isLoading) {
    return <BackdropProgress open={isLoading} />;
  }

  if (!userInfo) {
    return <ErrorHandler message={"Failed to load user info"} />;
  }

  if (error && !is404) {
    return <ErrorHandler message="Failed to load dinner request" />;
  }

  if (!isDodTimeActive) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ color: theme.palette.customText.primary.p2.active }}>
          Dinner On Demand
        </Typography>

        <Lottie animationData={coloredLogo} style={logoStyle} />

        <DodInfoMessage />
      </Box>
    );
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
            <DodInfoMessage />

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
