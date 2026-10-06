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

import { getCountries, getCountryCallingCode } from "libphonenumber-js";

// Every country with its dialing code, keyed by ISO region so countries sharing a code stay distinct.
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
export const COUNTRY_OPTIONS = getCountries()
  .map((iso) => ({ iso, name: regionNames.of(iso) ?? iso, dialCode: `+${getCountryCallingCode(iso)}` }))
  .sort((a, b) => a.name.localeCompare(b.name));
