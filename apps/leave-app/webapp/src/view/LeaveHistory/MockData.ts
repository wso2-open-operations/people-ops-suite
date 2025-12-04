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

export const mockLeaveHistory: LeaveData[] = [
  {
    id: "1",
    type: "Annual/Casual Leave",
    startDate: "10 Oct 2023",
    endDate: "12 Oct 2023",
    duration: "3 Days",
    status: "approved",
    month: "Oct",
    day: "10",
  },
  {
    id: "2",
    type: "Sick Leave",
    startDate: "15 Nov 2023",
    endDate: "16 Nov 2023",
    duration: "2 Days",
    status: "pending",
    month: "Nov",
    day: "15",
  },
  {
    id: "3",
    type: "Maternity Leave",
    startDate: "01 Dec 2023",
    endDate: "31 Jan 2024",
    duration: "61 Days",
    status: "approved",
    month: "Dec",
    day: "01",
  },
  {
    id: "4",
    type: "Emergency Leave",
    startDate: "20 Sep 2023",
    endDate: "20 Sep 2023",
    duration: "1 Day",
    status: "rejected",
    month: "Sep",
    day: "20",
  },
  {
    id: "5",
    type: "Emergency Leave",
    startDate: "20 Sep 2023",
    endDate: "20 Sep 2023",
    duration: "1 Day",
    status: "rejected",
    month: "Sep",
    day: "20",
  },
  {
    id: "6",
    type: "Emergency Leave",
    startDate: "20 Sep 2023",
    endDate: "20 Sep 2023",
    duration: "1 Day",
    status: "rejected",
    month: "Sep",
    day: "20",
  },
];
