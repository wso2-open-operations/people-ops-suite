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

import { useEffect, useState } from "react";

import { getApprovalStatusList } from "@root/src/services/leaveService";
import { ApprovalStatus, ApprovalStatusResponse } from "@root/src/types/types";

// Custom hook to fetch approval history data based on provided statuses.
export function useApprovalHistoryData(statuses: ApprovalStatus[]) {
  const [data, setData] = useState<ApprovalStatusResponse>({
    percentageOfEmployeesOnSabbaticalLeave: "0%",
    leaveApprovalStatusList: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchApprovalStatusList = async () => {
      try {
        setLoading(true);
        const response = await getApprovalStatusList({ status: statuses });
        setData(response);
      } catch (err) {
        console.error("Failed to fetch approval status list", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalStatusList();
  }, []);

  return { data, loading, error };
}
