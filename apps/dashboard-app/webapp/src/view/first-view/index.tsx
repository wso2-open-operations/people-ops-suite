// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import { useTheme } from "@mui/material";
import { Box, Card, CardContent, Stack, Typography } from "@wso2/oxygen-ui";
import { AreaChart, BarChart, PieChart, ResponsiveContainer } from "@wso2/oxygen-ui-charts-react";
import { Maximize2, Minimize2, TrendingUpIcon } from "@wso2/oxygen-ui-icons-react";

import { useEffect, useMemo, useState } from "react";

import {
  fetchLatestFoodWasteData,
  fetchMonthlyFoodWasteData,
  fetchWeeklyFoodWasteData,
  fetchYearlyFoodWasteData,
} from "@slices/foodWasteSlice/foodWaste";
import { useAppDispatch, useAppSelector } from "@slices/store";

const DEFAULT_WEEKLY_DATA = [{ date: "Jan 26", breakfast: 0, lunch: 0 }];

const DEFAULT_MONTHLY_DATA = [{ month: "Jan", breakfast: 0, lunch: 0 }];

const DEFAULT_ANNUAL_DATA = [{ year: "2026", breakfast: 0, lunch: 0 }];

export default function Dashboard() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Calculate date range for last 7 days
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    return {
      startDate: sevenDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  }, []);

  const {
    weeklyData = DEFAULT_WEEKLY_DATA,
    monthlyData = DEFAULT_MONTHLY_DATA,
    annualData = DEFAULT_ANNUAL_DATA,
    latestData,
  } = useAppSelector((state) => state.foodWaste);

  useEffect(() => {
    dispatch(fetchWeeklyFoodWasteData({ startDate, endDate }));
    dispatch(fetchMonthlyFoodWasteData());
    dispatch(fetchYearlyFoodWasteData());
    dispatch(fetchLatestFoodWasteData());
  }, [dispatch, endDate, startDate]);

  const kpis = useMemo(
    () => ({
      breakfast: latestData?.breakfast,
      lunch: latestData?.lunch,
    }),
    [latestData],
  );

  const compositionData = useMemo(() => {
    const breakfastValue = kpis.breakfast?.totalWasteKg ?? 0;
    const lunchValue = kpis.lunch?.totalWasteKg ?? 0;

    return [
      { name: "Breakfast", value: breakfastValue, color: "#00A97E" },
      { name: "Lunch", value: lunchValue, color: "#FF7300" },
    ];
  }, [kpis.breakfast?.totalWasteKg, kpis.lunch?.totalWasteKg]);

  const chartTextSx =
    theme.palette.mode === "dark"
      ? {
          "& .recharts-cartesian-axis-tick-value": {
            fill: `${theme.palette.common.white} !important`,
          },
          "& .recharts-cartesian-axis-label": {
            fill: `${theme.palette.common.white} !important`,
          },
          "& .recharts-legend-item-text": {
            color: `${theme.palette.common.white} !important`,
            fill: `${theme.palette.common.white} !important`,
          },
          "& .recharts-text": {
            fill: `${theme.palette.common.white} !important`,
          },
          "& text": {
            fill: `${theme.palette.common.white} !important`,
          },
        }
      : {};

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Apply dark mode text colors to chart SVG elements
  useEffect(() => {
    if (theme.palette.mode === "dark") {
      const textElements = document.querySelectorAll(
        ".recharts-cartesian-axis-tick text, .recharts-legend-item-text, .recharts-tooltip-wrapper text, .recharts-label, svg text",
      );
      textElements.forEach((el) => {
        if (el.getAttribute("fill") !== "#FF7300" && el.getAttribute("fill") !== "#00A97E") {
          el.setAttribute("fill", "#FFFFFF");
        }
      });
    }
  }, [theme.palette.mode, weeklyData, monthlyData, annualData]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  return (
    <Box
      sx={{
        p: isFullscreen ? 2 : 4,
        minHeight: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Box
        onClick={toggleFullscreen}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: "8px",
          borderRadius: "6px",
          backgroundColor: "#FF7300",
          color: "white",
          transition: "all 0.2s",
          zIndex: 100,
          "&:hover": {
            backgroundColor: "#E66900",
            boxShadow: "0 4px 12px rgba(255, 115, 0, 0.3)",
          },
        }}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </Box>

      <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: "300px" }}>
          <Card
            sx={{
              borderLeft: "10px solid #00A97E",
              borderRadius: 4,
              boxShadow: 1,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" fontWeight="bold">
                  Breakfast
                </Typography>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Waste
                    </Typography>
                    <Typography variant="h5">
                      {(kpis.breakfast?.totalWasteKg ?? 0).toFixed(1)}{" "}
                      <Typography component="span" variant="body2">
                        kg
                      </Typography>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Plate Count
                    </Typography>
                    <Typography variant="h5">{kpis.breakfast?.plateCount ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Waste/Plate (grams)
                    </Typography>
                    <Typography variant="h5" sx={{ color: "#FF7300" }}>
                      {kpis.breakfast?.plateCount
                        ? (
                            (kpis.breakfast.totalWasteKg * 1000) /
                            kpis.breakfast.plateCount
                          ).toFixed(1)
                        : "0.0"}{" "}
                      <Typography component="span" variant="caption">
                        g
                      </Typography>
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: "300px" }}>
          <Card
            sx={{
              borderLeft: "10px solid #FF7300",
              borderRadius: 4,
              boxShadow: 1,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" fontWeight="bold">
                  Lunch
                </Typography>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Waste
                    </Typography>
                    <Typography variant="h5">
                      {(kpis.lunch?.totalWasteKg ?? 0).toFixed(1)}{" "}
                      <Typography component="span" variant="body2">
                        kg
                      </Typography>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Plate Count
                    </Typography>
                    <Typography variant="h5">{kpis.lunch?.plateCount ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Waste/Plate (grams)
                    </Typography>
                    <Typography variant="h5" sx={{ color: "#FF7300" }}>
                      {kpis.lunch?.plateCount
                        ? ((kpis.lunch.totalWasteKg * 1000) / kpis.lunch.plateCount).toFixed(1)
                        : "0.0"}{" "}
                      <Typography component="span" variant="caption">
                        g
                      </Typography>
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "2 1 600px", minWidth: "300px" }}>
          <Card sx={{ borderRadius: 4, height: 400, ...chartTextSx }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <TrendingUpIcon color="#FF7300" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Weekly Waste Trend
                </Typography>
              </Stack>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={weeklyData}
                  xAxisDataKey="date"
                  areas={[
                    {
                      dataKey: "lunch",
                      name: "Lunch (kg)",
                      stroke: "#FF7300",
                      fill: "#FF7300",
                      fillOpacity: 0.4,
                      strokeWidth: 2,
                    },
                    {
                      dataKey: "breakfast",
                      name: "Breakfast (kg)",
                      stroke: "#00A97E",
                      fill: "#00A97E",
                      fillOpacity: 0.6,
                      strokeWidth: 2,
                    },
                  ]}
                  grid={{ show: true, strokeDasharray: "3 3" }}
                  xAxis={{ show: true }}
                  yAxis={{ show: true }}
                  legend={{ show: true }}
                  tooltip={{ show: true }}
                />
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
          <Card sx={{ borderRadius: 4, height: 400, ...chartTextSx }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Daily Waste Composition
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart
                  data={compositionData}
                  pies={[{ dataKey: "value", nameKey: "name" }]}
                  colors={compositionData.map((item) => item.color)}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  tooltip={{ show: true }}
                  legend={{ show: true, verticalAlign: "bottom" }}
                />
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: "300px" }}>
          <Card sx={{ borderRadius: 4, ...chartTextSx }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Monthly Overview
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={monthlyData}
                  xAxisDataKey="month"
                  bars={[
                    { dataKey: "breakfast", fill: "#00A97E", name: "Breakfast (kg)" },
                    { dataKey: "lunch", fill: "#FF7300", name: "Lunch (kg)" },
                  ]}
                  grid={{ show: true, strokeDasharray: "3 3" }}
                  legend={{ show: true }}
                  tooltip={{ show: true }}
                />
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 calc(50% - 12px)", minWidth: "300px" }}>
          <Card sx={{ borderRadius: 4, ...chartTextSx }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Annual Overview
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={annualData}
                  xAxisDataKey="year"
                  areas={[
                    {
                      dataKey: "breakfast",
                      name: "Breakfast (kg)",
                      stroke: "#00A97E",
                      fill: "#00A97E",
                      fillOpacity: 0.4,
                      stackId: "1",
                    },
                    {
                      dataKey: "lunch",
                      name: "Lunch (kg)",
                      stroke: "#FF7300",
                      fill: "#FF7300",
                      fillOpacity: 0.4,
                      stackId: "1",
                    },
                  ]}
                  grid={{ show: true, strokeDasharray: "3 3" }}
                  legend={{ show: true }}
                  tooltip={{ show: true }}
                />
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
