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
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Maximize2, Minimize2 } from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState, memo } from "react";

import {
  fetchLatestFoodWasteData,
  fetchMonthlyFoodWasteData,
  fetchWeeklyFoodWasteData,
  fetchYearlyFoodWasteData,
} from "@slices/foodWasteSlice/foodWaste";
import { useAppDispatch, useAppSelector } from "@slices/store";

type WeeklyDatum = {
  date: string;
  breakfast: number;
  lunch: number;
};

type MonthlyDatum = {
  month: string;
  breakfast: number;
  lunch: number;
};

type AnnualDatum = {
  year: string;
  breakfast: number;
  lunch: number;
};

type PieDatum = {
  name: string;
  value: number;
  color: string;
};

type OverviewDatum = {
  name: string;
  breakfast: number;
  lunch: number;
};

const DEFAULT_WEEKLY_DATA: WeeklyDatum[] = [];
const DEFAULT_MONTHLY_DATA: MonthlyDatum[] = [];
const DEFAULT_ANNUAL_DATA: AnnualDatum[] = [];

interface KPICardProps {
  title: string;
  totalWaste: number;
  plateCount: number;
  borderColor: string;
}

const KPICard = memo(({ title, totalWaste, plateCount, borderColor }: KPICardProps) => {
  const wastePerPlate = plateCount > 0 ? ((totalWaste * 1000) / plateCount).toFixed(1) : "0.0";

  return (
    <Box sx={{ flex: "1 1 0", width: "100%", minWidth: "300px" }}>
      <Card
        sx={{
          borderLeft: `8px solid ${borderColor}`,
          borderRadius: 2,
          boxShadow: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <CardContent sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight="bold">
              {title}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem", lineHeight: 1 }}>
                  Total Waste
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1rem" }}>
                  {totalWaste.toFixed(1)}{" "}
                  <Typography component="span" variant="caption" sx={{ fontSize: "0.6rem" }}>
                    kg
                  </Typography>
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem", lineHeight: 1 }}>
                  Plate Count
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1rem" }}>{plateCount}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem", lineHeight: 1 }}>
                  Waste/Plate
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#FF7300", fontSize: "1rem" }}>
                  {wastePerPlate}{" "}
                  <Typography component="span" variant="caption" sx={{ fontSize: "0.6rem" }}>
                    g
                  </Typography>
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
});

interface ChartProps {
  data: WeeklyDatum[];
  chartGridColor: string;
  chartLabelColor: string;
  chartTooltipStyle: CSSProperties;
}

const WeeklyTrendChart = memo(({ data, chartGridColor, chartLabelColor, chartTooltipStyle }: ChartProps) => (
  <Box sx={{ flex: "1 1 0", width: "100%", minWidth: "300px", height: "100%" }}>
    <Card sx={{ borderRadius: 2, height: "100%", borderLeft: "8px solid transparent" }}>
      <CardContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 2 } }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Weekly Waste Trend
        </Typography>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="date" tick={{ fill: chartLabelColor }} />
              <YAxis tick={{ fill: chartLabelColor }} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartLabelColor }} />
              <Legend wrapperStyle={{ color: chartLabelColor }} />
              <Area
                type="monotone"
                dataKey="lunch"
                name="Lunch (kg)"
                stroke="#FF7300"
                fill="#FF7300"
                fillOpacity={0.4}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="breakfast"
                name="Breakfast (kg)"
                stroke="#00A97E"
                fill="#00A97E"
                fillOpacity={0.6}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Box>
));

interface CompositionPieChartProps {
  data: PieDatum[];
  chartLabelColor: string;
  chartTooltipStyle: CSSProperties;
}

const CompositionPieChart = memo(({ data, chartLabelColor, chartTooltipStyle }: CompositionPieChartProps) => (
  <Box sx={{ flex: "1 1 0", width: "100%", minWidth: "300px", height: "100%" }}>
    <Card sx={{ borderRadius: 2, height: "100%", borderLeft: "8px solid transparent" }}>
      <CardContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 4 } }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Daily Waste Composition
        </Typography>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ bottom: 40 }}>
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartLabelColor }} />
              <Legend
                wrapperStyle={{ color: chartLabelColor, paddingTop: "20px" }}
                verticalAlign="bottom"
                align="center"
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Box>
));

interface OverviewChartsProps {
  title: string;
  data: OverviewDatum[];
  chartGridColor: string;
  chartLabelColor: string;
  chartTooltipStyle: CSSProperties;
}

const OverviewCharts = memo(({ title, data, chartGridColor, chartLabelColor, chartTooltipStyle }: OverviewChartsProps) => (
  <Box sx={{ flex: "1 1 0", width: "100%", minWidth: "300px", height: "100%" }}>
    <Card sx={{ borderRadius: 2, height: "100%", borderLeft: "8px solid transparent" }}>
      <CardContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 2 } }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="name" tick={{ fill: chartLabelColor }} />
              <YAxis tick={{ fill: chartLabelColor }} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: chartLabelColor }} />
              <Legend wrapperStyle={{ color: chartLabelColor }} />
              <Bar dataKey="lunch" name="Lunch (kg)" fill="#FF7300" radius={[4, 4, 0, 0]} />
              <Bar dataKey="breakfast" name="Breakfast (kg)" fill="#00A97E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Box>
));

export default function Dashboard() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Calculate date range for last 7 days using LOCAL dates (not UTC).
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const toLocalDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    return {
      startDate: toLocalDateStr(sevenDaysAgo),
      endDate: toLocalDateStr(today),
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

  const chartLabelColor = theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.common.black;
  const chartGridColor =
    theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.18)";
  const chartTooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${chartGridColor}`,
    color: chartLabelColor,
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  const weeklyChartData = useMemo(() => weeklyData || DEFAULT_WEEKLY_DATA, [weeklyData]);

  const pieData = useMemo(() => {
    if (!latestData) return [];
    const breakfastValue = Number(latestData.breakfast?.totalWasteKg ?? 0);
    const lunchValue = Number(latestData.lunch?.totalWasteKg ?? 0);
    return [
      { name: "Breakfast", value: breakfastValue, color: "#00A97E" },
      { name: "Lunch", value: lunchValue, color: "#FF7300" },
    ];
  }, [latestData]);

  const monthlyChartData = useMemo(() => {
    return (monthlyData || DEFAULT_MONTHLY_DATA).map((d) => ({
      name: d.month,
      breakfast: d.breakfast,
      lunch: d.lunch,
    }));
  }, [monthlyData]);

  const yearlyChartData = useMemo(() => {
    return (annualData || DEFAULT_ANNUAL_DATA).map((d) => ({
      name: d.year,
      breakfast: d.breakfast,
      lunch: d.lunch,
    }));
  }, [annualData]);

  return (
    <Box
      sx={{
        p: isFullscreen ? 2 : 3,
        pt: isFullscreen ? 3 : 3,
        height: isFullscreen ? "100vh" : "100%",
        width: "100%",
        position: "relative",
        bgcolor: "background.default",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
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


      <Stack
        spacing={1.5}
        sx={{
          height: "100%",
          width: "100%",
          flex: 1,
          minHeight: 0,
          overflow: "hidden"
        }}
      >
        {/* KPI Row - Reduced to 10% height */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="nowrap"
          sx={{
            flex: "0 0 auto",
            height: isFullscreen ? "10%" : "auto"
          }}
        >
          <KPICard
            title="Breakfast"
            totalWaste={Number(latestData?.breakfast?.totalWasteKg || 0)}
            plateCount={latestData?.breakfast?.plateCount || 0}
            borderColor="#00A97E"
          />
          <KPICard
            title="Lunch"
            totalWaste={Number(latestData?.lunch?.totalWasteKg || 0)}
            plateCount={latestData?.lunch?.plateCount || 0}
            borderColor="#FF7300"
          />
        </Stack>

        {/* Charts Row 1 - Weekly & Daily Composition - Flex 1 */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="nowrap"
          sx={{
            flex: 1,
            minHeight: 0,
            height: "100%"
          }}
        >
          <WeeklyTrendChart
            data={weeklyChartData}
            chartGridColor={chartGridColor}
            chartLabelColor={chartLabelColor}
            chartTooltipStyle={chartTooltipStyle}
          />
          <CompositionPieChart
            data={pieData}
            chartLabelColor={chartLabelColor}
            chartTooltipStyle={chartTooltipStyle}
          />
        </Stack>

        {/* Overview Chart Row - Monthly & Yearly Side by Side - Flex 1 */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="nowrap"
          sx={{
            flex: 1,
            minHeight: 0,
            height: "100%"
          }}
        >
          <OverviewCharts
            title="Monthly Overview"
            data={monthlyChartData}
            chartGridColor={chartGridColor}
            chartLabelColor={chartLabelColor}
            chartTooltipStyle={chartTooltipStyle}
          />
          <OverviewCharts
            title="Yearly Overview"
            data={yearlyChartData}
            chartGridColor={chartGridColor}
            chartLabelColor={chartLabelColor}
            chartTooltipStyle={chartTooltipStyle}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
