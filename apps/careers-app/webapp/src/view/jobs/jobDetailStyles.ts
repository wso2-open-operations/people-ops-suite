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

export const teamColors: Record<string, string> = {
  ENGINEERING: "#3B82F6",
  "CUSTOMER SUCCESS": "#8B5CF6",
  MARKETING: "#10B981",
  SALES: "#EF4444",
  "SALES ENGINEERING": "#F59E0B",
  "PEOPLE OPERATIONS": "#EC4899",
  FINANCE: "#06B6D4",
  "CHANNEL SALES": "#6366F1",
  "DIGITAL TRANSFORMATION": "#14B8A6",
  "BUSINESS OPERATIONS": "#F97316",
};

export const proseStyles = {
  fontSize: "1rem",
  lineHeight: "1.6rem",
  letterSpacing: ".008rem",
  color: "text.primary",
  "&, & *": { fontFamily: "inherit !important", color: "inherit !important" },
  "& a": { color: "#ff6700 !important", textDecoration: "underline" },
  "& h1, & h2, & h3": {
    color: "text.primary",
    fontWeight: 400,
    mt: 3,
    mb: 1.5,
    fontSize: "1.5rem",
    lineHeight: "2.3rem",
  },
  "& h4": { color: "text.primary", fontWeight: 400, fontSize: "1.2rem", lineHeight: "1.8rem" },
  "& ul, & ol": { pl: 2.5 },
  "& li": { mb: 0.75 },
  "& p": { mb: 1.5, letterSpacing: ".018rem" },
  "& strong": { color: "text.primary" },
} as const;
