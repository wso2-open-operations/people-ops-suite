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
import { Box, Button, Card, CardContent, IconButton, TextField, Typography } from "@wso2/oxygen-ui";
import { Calendar, Moon, Save, Sun, X } from "@wso2/oxygen-ui-icons-react";

import { useEffect, useState } from "react";

import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";

export default function DataEntry() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [darkMode, setDarkMode] = useState(false);

  const [breakfastId, setBreakfastId] = useState<number | null>(null);
  const [breakfastWaste, setBreakfastWaste] = useState("");
  const [breakfastPlates, setBreakfastPlates] = useState("");

  const [lunchId, setLunchId] = useState<number | null>(null);
  const [lunchWaste, setLunchWaste] = useState("");
  const [lunchPlates, setLunchPlates] = useState("");

  useEffect(() => {
    const loadDailyRecords = async () => {
      try {
        const response = await APIService.getInstance().get(AppConfig.serviceUrls.foodWasteDaily, {
          params: { date: selectedDate },
        });
        const daily = response.data as {
          breakfast?: { id?: number; totalWasteKg: number; plateCount: number } | null;
          lunch?: { id?: number; totalWasteKg: number; plateCount: number } | null;
        };

        if (daily.breakfast) {
          setBreakfastId(daily.breakfast.id ?? null);
          setBreakfastWaste(String(daily.breakfast.totalWasteKg));
          setBreakfastPlates(String(daily.breakfast.plateCount));
        } else {
          setBreakfastId(null);
          setBreakfastWaste("");
          setBreakfastPlates("");
        }

        if (daily.lunch) {
          setLunchId(daily.lunch.id ?? null);
          setLunchWaste(String(daily.lunch.totalWasteKg));
          setLunchPlates(String(daily.lunch.plateCount));
        } else {
          setLunchId(null);
          setLunchWaste("");
          setLunchPlates("");
        }
      } catch {}
    };

    loadDailyRecords();
  }, [selectedDate]);

  const handleSaveDailyRecord = () => {
    const hasBreakfastData = breakfastWaste && breakfastPlates;
    const hasLunchData = lunchWaste && lunchPlates;

    if (!hasBreakfastData && !hasLunchData) {
      alert("Please fill in at least breakfast or lunch data");
      return;
    }

    const requests: Promise<any>[] = [];

    if (hasBreakfastData) {
      const breakfastPayload = {
        totalWasteKg: parseFloat(breakfastWaste),
        plateCount: parseInt(breakfastPlates, 10),
      };

      if (breakfastId) {
        // Update existing record
        requests.push(
          APIService.getInstance().put(
            `${AppConfig.serviceUrls.foodWaste}/${breakfastId}`,
            breakfastPayload,
          ),
        );
      } else {
        // Create new record
        requests.push(
          APIService.getInstance().post(AppConfig.serviceUrls.foodWaste, {
            recordDate: selectedDate,
            mealType: "BREAKFAST",
            ...breakfastPayload,
          }),
        );
      }
    }

    if (hasLunchData) {
      const lunchPayload = {
        totalWasteKg: parseFloat(lunchWaste),
        plateCount: parseInt(lunchPlates, 10),
      };

      if (lunchId) {
        // Update existing record
        requests.push(
          APIService.getInstance().put(
            `${AppConfig.serviceUrls.foodWaste}/${lunchId}`,
            lunchPayload,
          ),
        );
      } else {
        // Create new record
        requests.push(
          APIService.getInstance().post(AppConfig.serviceUrls.foodWaste, {
            recordDate: selectedDate,
            mealType: "LUNCH",
            ...lunchPayload,
          }),
        );
      }
    }

    Promise.allSettled(requests)
      .then((results) => {
        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        if (failed === 0) {
          alert(
            `Daily record saved for ${new Date(selectedDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`,
          );
        } else if (successful > 0) {
          alert(`Saved ${successful} meal record(s). ${failed} failed.`);
        } else {
          alert("Failed to save daily records. Please try again.");
        }
      })
      .catch(() => {
        alert("Failed to save daily record. Please try again.");
      });
  };

  const handleCancelDailyRecord = () => {
    setBreakfastWaste("");
    setBreakfastPlates("");
    setLunchWaste("");
    setLunchPlates("");
  };

  const calculateWastePerPlate = (waste: string, plates: string) => {
    const parsedWaste = parseFloat(waste);
    const parsedPlates = parseFloat(plates);

    if (parsedWaste && parsedPlates && parsedPlates > 0) {
      return ((parsedWaste * 1000) / parsedPlates).toFixed(1);
    }

    return "0.0";
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: 3, py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h3" gutterBottom sx={{ color: "white" }}>
            Daily Data Entry
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Record daily food waste metrics for breakfast and lunch services
          </Typography>
        </Box>
        <IconButton onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Calendar size={24} color="primary" />
            <Box sx={{ flex: "1", maxWidth: 400 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: "1" }}>
              <Typography variant="body2" color="text.secondary">
                Selected Date
              </Typography>
              <Typography variant="h6">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 3,
          mb: 3,
        }}
      >
        <Card sx={{ borderTop: 4, borderColor: "success.main" }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
                pb: 2,
                borderBottom: 2,
                borderColor: "success.main",
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 64,
                  bgcolor: "success.main",
                  borderRadius: 2,
                }}
              />
              <Typography variant="h4">Breakfast</Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Total Waste (kg)"
                value={breakfastWaste}
                onChange={(e) => setBreakfastWaste(e.target.value)}
                placeholder="0.0"
                inputProps={{ step: "0.1" }}
              />

              <TextField
                fullWidth
                type="number"
                label="Total Plate Count"
                value={breakfastPlates}
                onChange={(e) => setBreakfastPlates(e.target.value)}
                placeholder="0"
              />

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Waste/Plate (grams)
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {calculateWastePerPlate(breakfastWaste, breakfastPlates)}{" "}
                    <Typography component="span" variant="h6">
                      g
                    </Typography>
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderTop: 4, borderColor: "primary.main" }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
                pb: 2,
                borderBottom: 2,
                borderColor: "primary.main",
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 64,
                  bgcolor: "primary.main",
                  borderRadius: 2,
                }}
              />
              <Typography variant="h4">Lunch</Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Total Waste (kg)"
                value={lunchWaste}
                onChange={(e) => setLunchWaste(e.target.value)}
                placeholder="0.0"
                inputProps={{ step: "0.1" }}
              />

              <TextField
                fullWidth
                type="number"
                label="Total Plate Count"
                value={lunchPlates}
                onChange={(e) => setLunchPlates(e.target.value)}
                placeholder="0"
              />

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Waste/Plate (grams)
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {calculateWastePerPlate(lunchWaste, lunchPlates)}{" "}
                    <Typography component="span" variant="h6">
                      g
                    </Typography>
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Daily Summary Preview
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Daily Waste
              </Typography>
              <Typography variant="h4">
                {(parseFloat(breakfastWaste || "0") + parseFloat(lunchWaste || "0")).toFixed(1)} kg
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Plates Served
              </Typography>
              <Typography variant="h4">
                {parseInt(breakfastPlates || "0") + parseInt(lunchPlates || "0")}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Waste/Plate (grams)
              </Typography>
              <Typography variant="h4" color="primary">
                {(() => {
                  const totalWaste =
                    parseFloat(breakfastWaste || "0") + parseFloat(lunchWaste || "0");
                  const totalPlates =
                    parseInt(breakfastPlates || "0") + parseInt(lunchPlates || "0");

                  return totalPlates > 0 ? ((totalWaste * 1000) / totalPlates).toFixed(1) : "0.0";
                })()}{" "}
                g
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Data Completion
              </Typography>
              <Typography variant="h4" color="success.main">
                {(() => {
                  const filled = [breakfastWaste, breakfastPlates, lunchWaste, lunchPlates].filter(
                    (value) => value !== "",
                  ).length;

                  return Math.round((filled / 4) * 100);
                })()}
                %
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", maxWidth: 400, mx: "auto" }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Save />}
          onClick={handleSaveDailyRecord}
          sx={{ flex: 1 }}
        >
          Save Daily Record
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<X />}
          onClick={handleCancelDailyRecord}
          sx={{ flex: 1 }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
