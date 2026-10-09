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

import { Job } from "@/types/types";

// Selections within one filter combine with OR; an empty selection matches every job.
// The results list and the per-option counts share these predicates so the
// numbers shown next to an option always equal the results it produces.

export const matchesSearch = (job: Job, search: string): boolean => {
  const term = search.toLowerCase();
  return !term || job.title.toLowerCase().includes(term) || job.team.toLowerCase().includes(term);
};

export const matchesJobType = (job: Job, jobType: string): boolean => !jobType || job.jobType === jobType;

export const matchesTeam = (job: Job, teams: string[]): boolean => teams.length === 0 || teams.includes(job.team);

// Office locations are compared to a job's countries by case-insensitive substring in either direction.
export const matchesLocation = (job: Job, locations: string[]): boolean =>
  locations.length === 0 ||
  job.country.some((c) =>
    locations.some((loc) => c.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(c.toLowerCase())),
  );
