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

import { Job } from "@/types/types";
import { matchesJobType, matchesLocation, matchesSearch, matchesTeam } from "@utils/jobFilterUtils";

const job = (overrides: Partial<Job> = {}): Job => ({
  id: "1",
  title: "Site Reliability Engineer",
  team: "Customer Success",
  country: ["Brazil"],
  jobType: "Full-time",
  publishStatus: "PUBLISHED",
  postedDate: "2026-07-01",
  ...overrides,
});

describe("matchesSearch", () => {
  it("matches everything when the search is empty", () => {
    expect(matchesSearch(job(), "")).toBe(true);
  });

  it("matches the title or the team, ignoring case", () => {
    expect(matchesSearch(job(), "reliability")).toBe(true);
    expect(matchesSearch(job(), "CUSTOMER")).toBe(true);
  });

  it("does not match other text", () => {
    expect(matchesSearch(job(), "marketing")).toBe(false);
  });
});

describe("matchesJobType", () => {
  it("matches everything when no type is chosen", () => {
    expect(matchesJobType(job(), "")).toBe(true);
  });

  it("matches only the chosen type", () => {
    expect(matchesJobType(job({ jobType: "Internship" }), "Internship")).toBe(true);
    expect(matchesJobType(job({ jobType: "Full-time" }), "Internship")).toBe(false);
  });
});

describe("matchesTeam", () => {
  it("matches everything when no team is chosen", () => {
    expect(matchesTeam(job(), [])).toBe(true);
  });

  it("combines several teams with OR", () => {
    expect(matchesTeam(job({ team: "Finance" }), ["Finance", "Sales"])).toBe(true);
    expect(matchesTeam(job({ team: "Marketing" }), ["Finance", "Sales"])).toBe(false);
  });
});

describe("matchesLocation", () => {
  it("matches everything when no location is chosen", () => {
    expect(matchesLocation(job(), [])).toBe(true);
  });

  it("matches a job's country ignoring case", () => {
    expect(matchesLocation(job({ country: ["Sri Lanka"] }), ["sri lanka"])).toBe(true);
  });

  it("matches by substring in either direction", () => {
    expect(matchesLocation(job({ country: ["United States"] }), ["States"])).toBe(true);
    expect(matchesLocation(job({ country: ["US"] }), ["US Remote"])).toBe(true);
  });

  it("matches a job with several countries when any one matches", () => {
    expect(matchesLocation(job({ country: ["Brazil", "Sri Lanka"] }), ["Sri Lanka"])).toBe(true);
  });

  it("does not match other locations", () => {
    expect(matchesLocation(job({ country: ["Brazil"] }), ["Sri Lanka"])).toBe(false);
  });
});

describe("filters together", () => {
  const jobs = [
    job({ id: "1", team: "Engineering", country: ["Sri Lanka"], title: "Backend Engineer" }),
    job({ id: "2", team: "Engineering", country: ["Brazil"], title: "Frontend Engineer" }),
    job({ id: "3", team: "Finance", country: ["Sri Lanka"], title: "Accountant" }),
  ];

  it("gives the count shown next to an option: the jobs that option would produce", () => {
    const inSriLanka = jobs.filter((j) => matchesLocation(j, ["Sri Lanka"]));
    const engineeringInSriLanka = inSriLanka.filter((j) => matchesTeam(j, ["Engineering"]));
    expect(inSriLanka.map((j) => j.id)).toEqual(["1", "3"]);
    expect(engineeringInSriLanka.map((j) => j.id)).toEqual(["1"]);
  });
});
