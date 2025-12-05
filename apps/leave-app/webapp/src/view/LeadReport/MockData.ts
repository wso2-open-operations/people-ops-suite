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

// NOTE: THIS IS MOCK TEST DATA FOR TESTING PURPOSES ONLY (TO BE REMOVED)
export interface LeaveData {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: "approved" | "pending" | "rejected";
  month: string;
  day: string;
}

export const rows = [
  { id: 1, employee: "John Doe", other: 2, annual: 5, paternity: 5, maternity: 0, lieu: 1, totalExclLieu: 12, total: 13 },
  { id: 2, employee: "Sarah Smith", other: 1, annual: 3, paternity: 0, maternity: 10, lieu: 2, totalExclLieu: 14, total: 16 },
  { id: 3, employee: "Michael Brown", other: 0, annual: 4, paternity: 0, maternity: 0, lieu: 3, totalExclLieu: 4, total: 7 },
  { id: 4, employee: "Emily Johnson", other: 3, annual: 6, paternity: 0, maternity: 12, lieu: 0, totalExclLieu: 21, total: 21 },
  { id: 5, employee: "David Wilson", other: 4, annual: 2, paternity: 7, maternity: 0, lieu: 1, totalExclLieu: 13, total: 14 },
  { id: 6, employee: "Olivia Davis", other: 2, annual: 5, paternity: 0, maternity: 8, lieu: 0, totalExclLieu: 15, total: 15 },
  { id: 7, employee: "James Miller", other: 1, annual: 7, paternity: 5, maternity: 0, lieu: 2, totalExclLieu: 13, total: 15 },
  { id: 8, employee: "Sophia Taylor", other: 0, annual: 4, paternity: 0, maternity: 6, lieu: 3, totalExclLieu: 10, total: 13 },
  { id: 9, employee: "Robert Anderson", other: 3, annual: 3, paternity: 4, maternity: 0, lieu: 0, totalExclLieu: 10, total: 10 },
  { id: 10, employee: "Lily Thomas", other: 2, annual: 5, paternity: 0, maternity: 7, lieu: 1, totalExclLieu: 14, total: 15 },
  { id: 11, employee: "Henry Moore", other: 1, annual: 2, paternity: 5, maternity: 0, lieu: 4, totalExclLieu: 8, total: 12 },
  { id: 12, employee: "Grace Martin", other: 3, annual: 6, paternity: 0, maternity: 5, lieu: 2, totalExclLieu: 14, total: 16 },
  { id: 13, employee: "Daniel Jackson", other: 2, annual: 7, paternity: 5, maternity: 0, lieu: 0, totalExclLieu: 14, total: 14 },
  { id: 14, employee: "Ava White", other: 4, annual: 3, paternity: 0, maternity: 9, lieu: 1, totalExclLieu: 16, total: 17 },
  { id: 15, employee: "Matthew Harris", other: 1, annual: 8, paternity: 4, maternity: 0, lieu: 2, totalExclLieu: 13, total: 15 },
  { id: 16, employee: "Ella Clark", other: 0, annual: 5, paternity: 0, maternity: 11, lieu: 0, totalExclLieu: 16, total: 16 },
  { id: 17, employee: "Nathan Lewis", other: 2, annual: 4, paternity: 5, maternity: 0, lieu: 3, totalExclLieu: 11, total: 14 },
  { id: 18, employee: "Chloe Walker", other: 3, annual: 2, paternity: 0, maternity: 7, lieu: 2, totalExclLieu: 12, total: 14 },
  { id: 19, employee: "Samuel Hall", other: 2, annual: 6, paternity: 4, maternity: 0, lieu: 1, totalExclLieu: 12, total: 13 },
  { id: 20, employee: "Zoe Young", other: 1, annual: 5, paternity: 0, maternity: 6, lieu: 0, totalExclLieu: 12, total: 12 },
];