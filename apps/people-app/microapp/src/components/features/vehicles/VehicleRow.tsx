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

import { AnimatePresence } from "motion/react";
import {
  DirectionsCarSharp,
  MoreHorizSharp,
  TwoWheelerSharp,
} from "@mui/icons-material";

import type { VehicleType } from "@/types";
import { MoreOptions } from "@/components/features/vehicles";

export interface VehicleRowProps {
  id: number;
  index?: number;
  type: VehicleType;
  number: string;
  selected?: boolean;
  active?: boolean;
  onSelect?: (index: number | undefined) => void;
  onDelete: () => void;
}

/**
 * VehicleRow Component
 *
 * Displays a single vehicle entry in a list, showing its type, number, and index.
 * Includes a toggleable options menu (with delete functionality) triggered by the More icon.
 *
 * Handles selection state to reveal the `MoreOptions` panel and supports vehicle deletion
 * via a mutation. Visual styling adjusts based on whether the row is active or selected.
 *
 * Props (VehicleRowProps):
 * - id: number – unique identifier for the vehicle (used for deletion)
 * - index: number – position of the vehicle in the list (displayed to user)
 * - type: "CAR" | "MOTORCYCLE" – vehicle type (used to display appropriate icon)
 * - number: string – license plate or vehicle number
 * - selected?: boolean – whether the row is currently selected (i.e., showing options)
 * - active?: boolean – whether the vehicle is currently active (used to dim non-selected rows)
 * - onSelect?: (index?: number) => void – toggles option visibility for this row
 * - onDelete: () => void – callback after successful vehicle deletion
 */
function VehicleRow({
  index,
  type,
  number,
  selected = false,
  active = false,
  onSelect,
  onDelete,
}: VehicleRowProps) {
  const handleToggleRowOptions = () => {
    if (selected) {
      onSelect?.(undefined);
    } else {
      onSelect?.(index!);
    }
  };

  return (
    <div className="font-semibold text-[1.2rem] border-b-[1px] border-[#E5E5E5]">
      <div
        className="grid grid-cols-[0.5fr_1fr_1.6fr_0.7fr] items-center px-1 py-[0.68rem] transition-opacity ease-out relative"
        style={{ opacity: active && !selected ? "50%" : "100%" }}
      >
        <span className="justify-self-start text-[#A6A6A6] text-[1.22rem]">
          {index ?? ""}
        </span>
        <span className="justify-self-center">
          {type === "MOTORCYCLE" ? (
            <TwoWheelerSharp className="scale-[1.36] text-[#E66801]" />
          ) : (
            <DirectionsCarSharp className="scale-[1.25] text-[#E66801]" />
          )}
        </span>
        <span className="justify-self-center">{number}</span>
        <span className="justify-self-end">
          <button
            className="flex p-1 relative"
            onClick={handleToggleRowOptions}
          >
            <MoreHorizSharp className="scale-[1.28] text-[#323232]" />
          </button>
        </span>
      </div>
      <AnimatePresence>
        {selected && (
          <MoreOptions
            onDelete={async () => {
              onDelete();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default VehicleRow;
