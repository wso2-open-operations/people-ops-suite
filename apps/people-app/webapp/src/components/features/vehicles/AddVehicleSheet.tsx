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

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { CircularProgress } from "@mui/material";
import { TwoWheelerSharp, DirectionsCarSharp } from "@mui/icons-material";

import { BottomSheet } from "@/components/shared";
import { OptionGroup, IconOption } from "@/components/features/vehicles";
import { validation } from "@/constants";
import type { Validity } from "@/types";
import { TextInput } from "@/components/ui";

import {
  validate,
  format as formatLicensePlate,
} from "@/utils/helpers/numberplate";
import { registerVehicle, type CreateVehiclePayload } from "@/services/api";

interface AddVehicleSheetProps {
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * AddVehicleSheet Component
 *
 * A bottom sheet modal used for registering a new vehicle. Allows users to select a vehicle type (Car or Motorcycle),
 * enter a license plate number, and submit the information to the backend via a mutation.
 *
 * Includes input validation for the license plate and shows a loading state during registration.
 * Designed for use in flows where users need to add their vehicle to an account or booking process.
 *
 * Props (AddVehicleSheetProps):
 * - onClose: () => void – callback to close the sheet
 * - onSubmit: () => void – callback after successful registration
 *
 * State:
 * - number: vehicle plate number entered by the user
 * - type: selected vehicle type (CAR or MOTORCYCLE)
 * - isValidPlate: validation state of the license plate (from `validation` enum)
 *
 * Behavior:
 * - Disables submission if input is invalid or a vehicle type isn't selected
 * - Shows a spinner overlay when the mutation is in progress
 * - Automatically formats the plate before submission
 */
function AddVehicleSheet({ onClose, onSubmit }: AddVehicleSheetProps) {
  const [number, setNumber] = useState<string>("");
  const [type, setType] = useState<"MOTORCYCLE" | "CAR" | undefined>(undefined); // TODO: Replace current type with `Vehicle` type
  const [isValidPlate, setIsValidPlate] = useState<Validity>(
    validation.UNCERTAIN
  );

  const mutation = useMutation({
    mutationFn: (payload: CreateVehiclePayload) => {
      return registerVehicle(payload);
    },
  });

  const busy = mutation.isPending || mutation.isError;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumber(e.target.value);
    setIsValidPlate(validate(e.target.value));
  };

  const handleVehicleRegistration = async () => {
    if (type && isValidPlate === validation.VALID) {
      await mutation.mutateAsync({ type, number: formatLicensePlate(number) });
      onSubmit();
      onClose();
    }
  };

  return (
    <BottomSheet
      onClose={() => {
        !busy && onClose();
      }}
    >
      <div className="relative">
        <OptionGroup
          className="flex justify-center gap-[1.35rem] mt-3 mb-5"
          value={type}
          onChange={(value) => {
            setType(value as "CAR" | "MOTORCYCLE" | undefined);
          }}
        >
          <IconOption name="MOTORCYCLE">
            <TwoWheelerSharp
              className="text-[#E66801]"
              style={{ fontSize: 35 }}
            />
          </IconOption>
          <IconOption name="CAR">
            <DirectionsCarSharp
              className="text-[#E66801] mb-1"
              style={{ fontSize: 35 }}
            />
          </IconOption>
        </OptionGroup>
        <div className="mt-8">
          <TextInput
            label="Vehicle Number"
            placeholder="What's on your license plate?"
            value={number}
            validity={isValidPlate}
            onChange={handleInputChange}
          />
        </div>
        <div className="relative mt-8">
          <button
            className="w-full p-[0.46rem] text-[1.2rem] font-semibold rounded-[0.6rem] transition-colors disabled:bg-[#F4F4F4] disabled:text-[#A7A7A7] bg-[#ECECEC] text-[#666666]"
            disabled={isValidPlate !== validation.VALID || !type || busy}
            onClick={handleVehicleRegistration}
          >
            Save
          </button>
        </div>
        {busy && (
          <div className="size-full grid place-items-center absolute top-0 left-0 bg-white/50 transition-colors">
            <CircularProgress
              size={26}
              thickness={5}
              style={{ color: "#4a4a4a" }}
            />
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

export default AddVehicleSheet;
