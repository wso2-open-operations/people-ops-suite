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

import { BRAND_TINT } from "@config/brand";

// The fully rounded button used for primary actions across the app.
export const pillButtonSx = { borderRadius: "999px", fontWeight: 700 } as const;

// The thin border and rounded corners of a card.
export const cardSx = { border: "1px solid", borderColor: "divider", borderRadius: "8px" } as const;

// A bordered row in a list (resumes, portfolio items, documents) that lights up in the brand color on hover.
export const rowCardSx = {
  p: 2,
  borderRadius: "10px",
  border: "1px solid",
  borderColor: "divider",
  transition: "border-color 0.15s, background-color 0.15s",
  "&:hover": { borderColor: "primary.main", backgroundColor: BRAND_TINT.faint },
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 1,
} as const;
