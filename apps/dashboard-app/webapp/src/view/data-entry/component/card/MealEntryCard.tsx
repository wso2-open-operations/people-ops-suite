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
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { memo, useMemo } from "react";

import { DataEntryMessage } from "@config/messages";

export interface FoodWasteData {
  id?: number | null;
  totalWasteKg: string;
  plateCount: string;
}

interface MealEntryCardProps {
  title: string;
  data: FoodWasteData;
  onChange: (field: keyof FoodWasteData, value: string) => void;
  disabled?: boolean;
}

const MealEntryCard = memo(({ title, data, onChange, disabled }: MealEntryCardProps) => {
  const isBreakfast = title === DataEntryMessage.mealLabels.breakfast;

  const wastePerPlate = useMemo(() => {
    const waste = parseFloat(data.totalWasteKg);
    const plates = parseFloat(data.plateCount);
    if (!Number.isNaN(waste) && !Number.isNaN(plates) && plates > 0) {
      return ((waste * 1000) / plates).toFixed(1);
    }
    return "0.0";
  }, [data.totalWasteKg, data.plateCount]);

  return (
    <Card sx={{ borderTop: 4, borderColor: isBreakfast ? "success.main" : "primary.main" }}>
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            pb: 2,
            borderBottom: 2,
            borderColor: isBreakfast ? "success.main" : "primary.main",
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 64,
              bgcolor: isBreakfast ? "success.main" : "primary.main",
              borderRadius: 2,
            }}
          />
          <Typography variant="h4">{title}</Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            fullWidth
            type="number"
            label={DataEntryMessage.fields.totalWasteKg}
            value={data.totalWasteKg}
            disabled={disabled}
            onChange={(e) => onChange("totalWasteKg", e.target.value)}
            placeholder={DataEntryMessage.placeholders.waste}
            slotProps={{ htmlInput: { step: "0.1", min: "0" } }}
          />

          <TextField
            fullWidth
            type="number"
            label={DataEntryMessage.fields.totalPlateCount}
            value={data.plateCount}
            disabled={disabled}
            onChange={(e) => onChange("plateCount", e.target.value)}
            placeholder={DataEntryMessage.placeholders.plates}
            slotProps={{ htmlInput: { min: "0" } }}
          />

          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                {DataEntryMessage.fields.wastePerPlateGrams}
              </Typography>
              <Typography variant="h3" color={isBreakfast ? "success.main" : "primary.main"}>
                {wastePerPlate}{" "}
                <Typography component="span" variant="h6">
                  {DataEntryMessage.units.grams}
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </CardContent>
    </Card>
  );
});

export default MealEntryCard;
