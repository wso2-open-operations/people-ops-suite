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

import { describe, expect, it } from "vitest";

import { type RouteData, dataNeededBy } from "@utils/routeData";

const none: RouteData = {
  jobs: false,
  orgStructure: false,
  jobDetails: false,
  applications: false,
  profile: false,
};

describe("dataNeededBy", () => {
  it.each([
    ["/", { jobs: true, orgStructure: true, jobDetails: true }],
    ["/jobs", { jobs: true, orgStructure: true, jobDetails: true }],
    ["/jobs/228", { jobs: true, jobDetails: true, profile: true }],
    ["/jobs/228/intern-customer-success", { jobs: true, jobDetails: true, profile: true }],
    ["/applications", { jobs: true, applications: true }],
    ["/applications/5442", { jobs: true, applications: true }],
    ["/applications/5442/documents", { applications: true, profile: true }],
    ["/profile", { profile: true }],
  ])("loads only what %s reads", (pathname, needed) => {
    expect(dataNeededBy(pathname)).toEqual({ ...none, ...needed });
  });

  it("reads a path with a trailing slash like the same path without it", () => {
    expect(dataNeededBy("/applications/5442/")).toEqual(dataNeededBy("/applications/5442"));
    expect(dataNeededBy("/profile/")).toEqual(dataNeededBy("/profile"));
  });

  it("loads nothing for a path the app does not have", () => {
    expect(dataNeededBy("/nowhere")).toEqual(none);
    expect(dataNeededBy("/applications/5442/other")).toEqual(none);
  });
});
