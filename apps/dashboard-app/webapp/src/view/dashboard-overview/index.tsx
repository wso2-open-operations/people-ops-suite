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
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
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
  PieLabelRenderProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CSSProperties } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CHART_COLORS, CHART_LAYOUT, DATE_RANGE_DAYS } from "@config/feature";
import { DashboardOverviewMessage } from "@config/messages";
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
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: "0.7rem", lineHeight: 1 }}
                >
                  {DashboardOverviewMessage.kpi.totalWaste}
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1rem" }}>
                  {totalWaste.toFixed(1)}{" "}
                  <Typography component="span" variant="caption" sx={{ fontSize: "0.6rem" }}>
                    kg
                  </Typography>
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: "0.7rem", lineHeight: 1 }}
                >
                  {DashboardOverviewMessage.kpi.plateCount}
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1rem" }}>
                  {plateCount}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: "0.7rem", lineHeight: 1 }}
                >
                  {DashboardOverviewMessage.kpi.wastePerPlate}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: CHART_COLORS.kpiAccent, fontSize: "1rem" }}
                >
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

const WeeklyTrendChart = memo(
  ({ data, chartGridColor, chartLabelColor, chartTooltipStyle }: ChartProps) => (
    <Box sx={{ flex: "1 1 0", width: "100%", minWidth: "300px", height: "100%" }}>
      <Card sx={{ borderRadius: 2, height: "100%", borderLeft: "8px solid transparent" }}>
        <CardContent
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            "&:last-child": { pb: 2 },
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            {DashboardOverviewMessage.charts.weeklyTrend}
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
                  name={DashboardOverviewMessage.charts.lunchLegend}
                  stroke={CHART_COLORS.lunch}
                  fill={CHART_COLORS.lunch}
                  fillOpacity={0.4}
                  strokeWidth={2}
                  dot={{ r: CHART_LAYOUT.dotRadius }}
                  activeDot={{ r: CHART_LAYOUT.activeDotRadius }}
                />
                <Area
                  type="monotone"
                  dataKey="breakfast"
                  name={DashboardOverviewMessage.charts.breakfastLegend}
                  stroke={CHART_COLORS.breakfast}
                  fill={CHART_COLORS.breakfast}
                  fillOpacity={0.6}
                  strokeWidth={2}
                  dot={{ r: CHART_LAYOUT.dotRadius }}
                  activeDot={{ r: CHART_LAYOUT.activeDotRadius }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  ),
);

interface CompositionPieChartProps {
  data: PieDatum[];
  chartLabelColor: string;
  chartTooltipStyle: CSSProperties;
}

const renderPieLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    cx == null ||
    cy == null ||
    midAngle == null ||
    innerRadius == null ||
    outerRadius == null ||
    percent == null
  )
    return null;
  if (percent <= 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "middle"}
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PieTooltip = ({
  active,
  payload,
  tooltipStyle,
}: {
  active?: boolean;
  payload?: { payload: PieDatum; name: string; value: number }[];
  tooltipStyle: CSSProperties;
}) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload;
    return (
      <Box
        sx={{
          ...tooltipStyle,
          px: 1.5,
          py: 1,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {name}:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 400 }}>
          {value.toFixed(1)} kg
        </Typography>
      </Box>
    );
  }
  return null;
};

const CompositionPieChart = memo(
  ({ data, chartLabelColor, chartTooltipStyle }: CompositionPieChartProps) => (
    <Box sx={{ flex: "1 1 0", width: "100%", minWidth: "300px", height: "100%" }}>
      <Card sx={{ borderRadius: 2, height: "100%", borderLeft: "8px solid transparent" }}>
        <CardContent
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            "&:last-child": { pb: 4 },
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            {DashboardOverviewMessage.charts.dailyComposition}
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ bottom: 40 }}>
                <Tooltip
                  content={({ active, payload }) => (
                    <PieTooltip
                      active={active}
                      payload={payload as { payload: PieDatum; name: string; value: number }[]}
                      tooltipStyle={chartTooltipStyle}
                    />
                  )}
                />
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
                  innerRadius={CHART_LAYOUT.pieInnerRadius}
                  outerRadius={CHART_LAYOUT.pieOuterRadius}
                  label={renderPieLabel}
                  labelLine={false}
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
  ),
);

interface OverviewChartsProps {
  title: string;
  data: OverviewDatum[];
  chartGridColor: string;
  chartLabelColor: string;
  chartTooltipStyle: CSSProperties;
}

const OverviewCharts = memo(
  ({ title, data, chartGridColor, chartLabelColor, chartTooltipStyle }: OverviewChartsProps) => (
    <Box sx={{ flex: "1 1 0", width: "100%", minWidth: "300px", height: "100%" }}>
      <Card sx={{ borderRadius: 2, height: "100%", borderLeft: "8px solid transparent" }}>
        <CardContent
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            "&:last-child": { pb: 2 },
          }}
        >
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
                <Bar
                  dataKey="lunch"
                  name={DashboardOverviewMessage.charts.lunchLegend}
                  fill={CHART_COLORS.lunch}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="breakfast"
                  name={DashboardOverviewMessage.charts.breakfastLegend}
                  fill={CHART_COLORS.breakfast}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  ),
);

export default function Dashboard() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const { startDate, endDate } = useMemo(() => {
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DATE_RANGE_DAYS);

    const toLocalDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    return {
      startDate: toLocalDateStr(sevenDaysAgo),
      endDate: toLocalDateStr(currentDate),
    };
  }, [currentDate]);

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

  const chartLabelColor = useMemo(
    () => (theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.common.black),
    [theme.palette.mode, theme.palette.common.white, theme.palette.common.black],
  );
  const chartGridColor = useMemo(
    () =>
      theme.palette.mode === "dark" ? CHART_LAYOUT.gridOpacityDark : CHART_LAYOUT.gridOpacityLight,
    [theme.palette.mode],
  );
  const chartTooltipStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${chartGridColor}`,
      color: chartLabelColor,
    }),
    [theme.palette.background.paper, chartGridColor, chartLabelColor],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle fullscreen mode", error);
    }
  }, []);

  const weeklyChartData = useMemo(() => weeklyData || DEFAULT_WEEKLY_DATA, [weeklyData]);

  const pieData = useMemo(() => {
    if (!latestData) return [];
    const breakfastValue = Number(latestData.breakfast?.totalWasteKg ?? 0);
    const lunchValue = Number(latestData.lunch?.totalWasteKg ?? 0);
    return [
      {
        name: DashboardOverviewMessage.mealLabels.breakfast,
        value: breakfastValue,
        color: CHART_COLORS.breakfast,
      },
      {
        name: DashboardOverviewMessage.mealLabels.lunch,
        value: lunchValue,
        color: CHART_COLORS.lunch,
      },
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
      ref={containerRef}
      sx={{
        p: 3,
        height: "100%",
        width: "100%",
        position: "relative",
        bgcolor: "background.default",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <IconButton
        onClick={toggleFullscreen}
        aria-label={
          isFullscreen
            ? DashboardOverviewMessage.fullscreen.exitTitle
            : DashboardOverviewMessage.fullscreen.enterTitle
        }
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
          backgroundColor: CHART_COLORS.lunch,
          color: CHART_COLORS.white,
          transition: "all 0.2s",
          zIndex: 100,
          "&:hover": {
            backgroundColor: CHART_COLORS.lunchHover,
            boxShadow: "0 4px 12px rgba(255, 115, 0, 0.3)",
          },
        }}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </IconButton>

      <Stack
        spacing={1.5}
        sx={{
          height: "100%",
          width: "100%",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* KPI Row - Reduced to 10% height */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="nowrap"
          sx={{
            flex: "0 0 auto",
            height: "auto",
          }}
        >
          <KPICard
            title={DashboardOverviewMessage.mealLabels.breakfast}
            totalWaste={Number(latestData?.breakfast?.totalWasteKg || 0)}
            plateCount={latestData?.breakfast?.plateCount || 0}
            borderColor={CHART_COLORS.breakfast}
          />
          <KPICard
            title={DashboardOverviewMessage.mealLabels.lunch}
            totalWaste={Number(latestData?.lunch?.totalWasteKg || 0)}
            plateCount={latestData?.lunch?.plateCount || 0}
            borderColor={CHART_COLORS.lunch}
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
            height: "100%",
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
            height: "100%",
          }}
        >
          <OverviewCharts
            title={DashboardOverviewMessage.charts.monthlyOverview}
            data={monthlyChartData}
            chartGridColor={chartGridColor}
            chartLabelColor={chartLabelColor}
            chartTooltipStyle={chartTooltipStyle}
          />
          <OverviewCharts
            title={DashboardOverviewMessage.charts.yearlyOverview}
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
