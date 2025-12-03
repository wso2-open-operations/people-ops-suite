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

export interface EmployeeLeaveData {
  id: number;
  email: string;
  startDate: Date;
  endDate: Date;
  Status: string;
}

export const rows: EmployeeLeaveData[] = [
  {
    id: 1,
    email: "john.doe@example.com",
    startDate: new Date("2025-01-05"),
    endDate: new Date("2025-01-10"),
    Status: "Approved",
  },
  {
    id: 2,
    email: "emma.smith@example.com",
    startDate: new Date("2025-02-12"),
    endDate: new Date("2025-02-14"),
    Status: "Pending",
  },
  {
    id: 3,
    email: "liam.kumar@example.com",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-03-03"),
    Status: "Rejected",
  },
  {
    id: 4,
    email: "sophia.ranasinghe@example.com",
    startDate: new Date("2025-04-20"),
    endDate: new Date("2025-04-25"),
    Status: "Approved",
  },
  {
    id: 5,
    email: "michael.perera@example.com",
    startDate: new Date("2025-05-10"),
    endDate: new Date("2025-05-15"),
    Status: "Pending",
  },
];
