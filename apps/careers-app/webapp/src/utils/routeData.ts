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

import { matchPath } from "react-router-dom";

// The store data a route needs.
export interface RouteData {
  jobs: boolean;
  orgStructure: boolean;
  jobDetails: boolean;
  applications: boolean;
  profile: boolean;
}

const isAt = (pattern: string, pathname: string) => matchPath({ path: pattern, end: true }, pathname) !== null;

// The data the route at the path needs; keep in step with app/AppHandler.tsx.
export function dataNeededBy(pathname: string): RouteData {
  const onJobList = isAt("/", pathname) || isAt("/jobs", pathname);
  const onJobPage = isAt("/jobs/:id/:slug?", pathname);
  const onApplications = isAt("/applications", pathname) || isAt("/applications/:id", pathname);
  const onDocuments = isAt("/applications/:id/documents", pathname);
  return {
    // The job list tells whether a vacancy is still open.
    jobs: onJobList || onJobPage || onApplications,
    orgStructure: onJobList,
    jobDetails: onJobList || onJobPage,
    applications: onApplications || onDocuments,
    profile: isAt("/profile", pathname) || onJobPage || onDocuments,
  };
}
