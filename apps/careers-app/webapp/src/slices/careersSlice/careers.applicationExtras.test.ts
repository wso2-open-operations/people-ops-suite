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

import { describe, expect, it, vi } from "vitest";

import reducer, { clearUserData, setApplicationExtras } from "@slices/careersSlice/careers";

// The slice reads the app's config when it loads, which needs a browser window.
vi.mock("@config/config", () => ({
  AppConfig: { serviceUrls: { candidates: "", jobs: "", applications: "", documents: "" } },
  ServiceBaseUrl: "",
  UseMockProfile: false,
}));

const initial = reducer(undefined, { type: "init" });

describe("setApplicationExtras", () => {
  it("keeps what was loaded for an application and merges later loads into it", () => {
    let state = reducer(
      initial,
      setApplicationExtras({ id: "a1", generation: initial.sessionGeneration, extras: { interviews: [] } }),
    );
    state = reducer(
      state,
      setApplicationExtras({
        id: "a1",
        generation: state.sessionGeneration,
        extras: { documentsStatus: null },
      }),
    );
    expect(state.applicationExtras.a1).toEqual({ interviews: [], documentsStatus: null });
  });

  it("keeps each application's data apart", () => {
    let state = reducer(
      initial,
      setApplicationExtras({ id: "a1", generation: initial.sessionGeneration, extras: { interviews: [] } }),
    );
    state = reducer(
      state,
      setApplicationExtras({ id: "a2", generation: state.sessionGeneration, extras: { offerLetter: null } }),
    );
    expect(Object.keys(state.applicationExtras)).toEqual(["a1", "a2"]);
    expect(state.applicationExtras.a2).toEqual({ offerLetter: null });
  });

  it("drops a reply that arrives after the candidate's data was cleared", () => {
    const generationBefore = initial.sessionGeneration;
    const cleared = reducer(initial, clearUserData());
    const state = reducer(
      cleared,
      setApplicationExtras({ id: "a1", generation: generationBefore, extras: { interviews: [] } }),
    );
    expect(state.applicationExtras).toEqual({});
  });
});

describe("clearUserData", () => {
  it("forgets the loaded application data", () => {
    const loaded = reducer(
      initial,
      setApplicationExtras({ id: "a1", generation: initial.sessionGeneration, extras: { interviews: [] } }),
    );
    expect(reducer(loaded, clearUserData()).applicationExtras).toEqual({});
  });
});
