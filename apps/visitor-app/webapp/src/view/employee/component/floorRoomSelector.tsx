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
import React from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  FormHelperText,
  Autocomplete,
  TextField,
} from "@mui/material";
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Room as RoomIcon,
} from "@mui/icons-material";
import { FloorRoom } from "@root/src/slices/visitSlice/visit";

interface FloorRoomSelectorProps {
  availableFloorsAndRooms: FloorRoom[];
  selectedFloorsAndRooms: FloorRoom[];
  onChange: (floorsAndRooms: FloorRoom[]) => void;
  error?: string;
}

const FloorRoomSelector: React.FC<FloorRoomSelectorProps> = ({
  availableFloorsAndRooms,
  selectedFloorsAndRooms,
  onChange,
  error,
}) => {
  const addFloor = (floor: string) => {
    if (!selectedFloorsAndRooms.find((item) => item.floor === floor)) {
      onChange([...selectedFloorsAndRooms, { floor, rooms: [] }]);
    }
  };

  const removeFloor = (floor: string) => {
    onChange(selectedFloorsAndRooms.filter((item) => item.floor !== floor));
  };

  const updateRooms = (floor: string, rooms: string[]) => {
    const updatedFloors = selectedFloorsAndRooms.map((item) =>
      item.floor === floor ? { ...item, rooms } : item
    );
    onChange(updatedFloors);
  };

  const getAvailableRoomsForFloor = (floor: string): string[] => {
    const floorData = availableFloorsAndRooms.find(
      (item) => item.floor === floor
    );
    return floorData ? floorData.rooms : [];
  };

  const getSelectedRoomsForFloor = (floor: string): string[] => {
    const floorData = selectedFloorsAndRooms.find(
      (item) => item.floor === floor
    );
    return floorData ? floorData.rooms : [];
  };

  return (
    <Box>
      {/* Floor Selection */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        Select Floors
      </Typography>

      <Grid container spacing={1} sx={{ mb: 3 }}>
        {availableFloorsAndRooms.map((floorData) => {
          const isSelected = selectedFloorsAndRooms.some(
            (item) => item.floor === floorData.floor
          );
          return (
            <Grid item key={floorData.floor}>
              <Button
                variant={"outlined"}
                size="small"
                onClick={() => addFloor(floorData.floor)}
                disabled={isSelected}
                sx={{ minWidth: "auto" }}
              >
                {floorData.floor}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      {/* Selected Floors and Room Selection */}
      {selectedFloorsAndRooms.length > 0 && (
        <Box>
          {selectedFloorsAndRooms.map((floorRoom) => {
            const availableRooms = getAvailableRoomsForFloor(floorRoom.floor);
            const selectedRooms = getSelectedRoomsForFloor(floorRoom.floor);

            return (
              <Card key={floorRoom.floor} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <BusinessIcon color="primary" fontSize="small" />
                      {floorRoom.floor}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => removeFloor(floorRoom.floor)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  {/* Room Selection with Chips in Input */}
                  <Autocomplete
                    multiple
                    options={availableRooms}
                    value={selectedRooms}
                    onChange={(event, newValue) => {
                      updateRooms(floorRoom.floor, newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search and select rooms"
                        placeholder={
                          selectedRooms.length === 0
                            ? "Type to search rooms..."
                            : ""
                        }
                        variant="outlined"
                        fullWidth
                        size="small"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option}
                          label={option}
                          icon={<RoomIcon />}
                          color="primary"
                          variant="filled"
                          size="small"
                        />
                      ))
                    }
                    renderOption={(props, option) => {
                      const { key, ...rest } = props; // take key out
                      return (
                        <Box component="li" key={key} {...rest}>
                          <RoomIcon sx={{ mr: 1 }} fontSize="small" />
                          {option}
                        </Box>
                      );
                    }}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
};

export default FloorRoomSelector;
