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

import { calculateServiceLength } from "./utils";

describe("calculateServiceLength", () => {
  const NOW = new Date("2026-10-01T10:30:00");

  it("counts up to now when there is no final day of employment", () => {
    expect(calculateServiceLength("2020-04-01", null, NOW)).toEqual({
      years: 6,
      months: 6,
    });
  });

  it("stops at a final day of employment in the past", () => {
    expect(calculateServiceLength("2020-04-01", "2023-06-15", NOW)).toEqual({
      years: 3,
      months: 2,
    });
  });

  it("counts up to now while the final day of employment is still ahead", () => {
    expect(calculateServiceLength("2020-04-01", "2026-12-31", NOW)).toEqual({
      years: 6,
      months: 6,
    });
  });

  it("ignores a malformed final day of employment", () => {
    expect(calculateServiceLength("2020-04-01", "not-a-date", NOW)).toEqual({
      years: 6,
      months: 6,
    });
  });

  it("returns null when the final day is before the start date", () => {
    expect(calculateServiceLength("2020-04-01", "2019-01-01", NOW)).toBeNull();
  });

  it("returns null for a future start date", () => {
    expect(calculateServiceLength("2027-01-01", null, NOW)).toBeNull();
  });
});
