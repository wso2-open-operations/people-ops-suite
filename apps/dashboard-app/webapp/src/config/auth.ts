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

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
export const SESSION_PROMPT_BEFORE_IDLE_MS = 4_000;
export const SESSION_IDLE_THROTTLE_MS = 500;

export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY_MS = 100;
export const API_RETRY_STATUS_CODES: [number, number][] = [[401, 401]];
export const API_RETRY_METHODS = ["GET", "HEAD", "OPTIONS"];
