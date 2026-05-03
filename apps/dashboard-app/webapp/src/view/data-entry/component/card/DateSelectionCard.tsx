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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Calendar } from "lucide-react";

import { CHART_COLORS } from "@config/feature";
import { DataEntryMessage } from "@config/messages";

interface DateSelectionCardProps {
  selectedDate: string;
  isSaving: boolean;
  loadError: string | null;
  onDateChange: (date: string) => void;
  getDisplayDate: (date: string) => string;
}

function DateSelectionCard(props: DateSelectionCardProps) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Calendar size={24} color={CHART_COLORS.breakfast} />
          <Box sx={{ flex: "1", maxWidth: 400 }}>
            <Typography
              component="label"
              htmlFor="data-entry-date"
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {DataEntryMessage.selectDate}
            </Typography>
            <TextField
              id="data-entry-date"
              fullWidth
              type="date"
              disabled={props.isSaving}
              value={props.selectedDate}
              onChange={(e) => props.onDateChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          <Box sx={{ flex: "1" }}>
            <Typography variant="body2" color="text.secondary">
              {DataEntryMessage.selectedDate}
            </Typography>
            <Typography variant="h6">{props.getDisplayDate(props.selectedDate)}</Typography>
            {props.loadError && (
              <Typography variant="body2" sx={{ color: "error.main", mt: 1 }}>
                {props.loadError}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default DateSelectionCard;
