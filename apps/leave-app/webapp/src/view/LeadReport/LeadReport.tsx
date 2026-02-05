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

import { Stack } from "@mui/material";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";

import { useState } from "react";

import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import {
  selectLeadReport,
  selectLeadReportState,
} from "@root/src/slices/leadReportSlice/leadReport";
import { useAppSelector } from "@root/src/slices/store";
import { State } from "@root/src/types/types";

import LeadReportTable from "./component/LeadReportTable";
import Toolbar from "./component/Toolbar";

export default function LeadReport() {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf("year"));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  const reportData = useAppSelector(selectLeadReport);
  const leadReportState = useAppSelector(selectLeadReportState);
  const loading = leadReportState === State.loading;

  return (
    <Stack gap="1.5rem" maxWidth={PAGE_MAX_WIDTH} mx="auto">
      <Toolbar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />
      <LeadReportTable reportData={reportData} loading={loading} />
    </Stack>
  );
}
