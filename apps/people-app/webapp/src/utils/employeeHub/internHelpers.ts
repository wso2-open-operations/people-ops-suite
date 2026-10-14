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

export function formatNameFromEmail(email: string | undefined | null): string {
  const trimmed = (email || "").trim();
  if (!trimmed) return "—";
  const local = trimmed.split("@")[0];
  return local.replace(/[._]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Reporting Manager / Mentor fields in the source data only ever store an
// email address, never a display name. This resolves the actual person's
// name by matching that email against the employee list loaded from the
// backend, falling back to a formatted guess from the email's local-part if no
// match is found.
export function resolveNameByEmail(
  email: string | undefined | null,
  employees: { email?: string; name?: string }[]
): string {
  const trimmed = (email || "").trim();
  if (!trimmed) return "—";
  const match = employees.find((e) => (e.email || "").trim().toLowerCase() === trimmed.toLowerCase());
  if (match?.name) return match.name;
  return formatNameFromEmail(trimmed);
}
