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
import Typography from "@mui/material/Typography";

import { DataEntryMessage } from "@config/messages";

import type { FoodWasteData } from "./MealEntryCard";

interface DailySummaryCardProps {
  breakfastData: FoodWasteData;
  lunchData: FoodWasteData;
}

function DailySummaryCard(props: DailySummaryCardProps) {
  const totalWaste = parseFloat(props.breakfastData.totalWasteKg || "0") + parseFloat(props.lunchData.totalWasteKg || "0");
  const totalPlates = parseInt(props.breakfastData.plateCount || "0", 10) + parseInt(props.lunchData.plateCount || "0", 10);
  const wastePerPlate = totalPlates > 0 ? ((totalWaste * 1000) / totalPlates).toFixed(1) : "0.0";
  const filled = [
    props.breakfastData.totalWasteKg,
    props.breakfastData.plateCount,
    props.lunchData.totalWasteKg,
    props.lunchData.plateCount,
  ].filter((value) => value !== "").length;
  const completion = Math.round((filled / 4) * 100);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {DataEntryMessage.summary.title}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {DataEntryMessage.summary.totalDailyWaste}
            </Typography>
            <Typography variant="h4">{totalWaste.toFixed(1)} {DataEntryMessage.units.kilograms}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {DataEntryMessage.summary.totalPlatesServed}
            </Typography>
            <Typography variant="h4">{totalPlates}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {DataEntryMessage.fields.wastePerPlateGrams}
            </Typography>
            <Typography variant="h4" color="primary">
              {wastePerPlate} {DataEntryMessage.units.grams}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {DataEntryMessage.summary.dataCompletion}
            </Typography>
            <Typography variant="h4" color="success.main">
              {completion}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default DailySummaryCard;
