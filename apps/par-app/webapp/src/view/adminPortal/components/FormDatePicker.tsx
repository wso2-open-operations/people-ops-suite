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

import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const FormDatePicker = ({
  name,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  minDate,
  maxDate,
  disabled,
}: any) => {
  return (
    <DatePicker
      disabled={disabled}
      value={value ? dayjs(value) : null}
      onChange={(newValue) => {
        // Converts the Dayjs object to your required string format immediately
        const formattedDate = newValue ? dayjs(newValue).format("YYYY-MM-DD") : "";
        onChange(name, formattedDate);
      }}
      minDate={minDate ? dayjs(minDate) : undefined}
      maxDate={maxDate ? dayjs(maxDate) : undefined}
      slotProps={{
        textField: {
          size: "small",
          fullWidth: true,
          name: name,
          onBlur: onBlur,
          error: Boolean(error),
          helperText: helperText as string,
        },
      }}
    />
  );
};

export default FormDatePicker;
