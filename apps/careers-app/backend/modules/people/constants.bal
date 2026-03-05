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

# client retry configuration for max retry attempts.
public const int RETRY_COUNT = 3;

# client retry configuration for wait interval in seconds.
public const decimal RETRY_INTERVAL = 3.0;

# client retry configuration for interval increment in seconds.
public const float RETRY_BACKOFF_FACTOR = 2.0;

# client retry configuration for maximum wait interval in seconds.
public const decimal RETRY_MAX_INTERVAL = 20.0;

# Default limit for the entity.
public const int DEFAULT_LIMIT = 100;

# Client retry configuration for wait interval in seconds.
const CONSTANT_RETRY_INTERVAL = 3.0d;

# Client retry configuration for interval increment in seconds.
const CONSTANT_RETRY_BACKOFF_FACTOR = 2.0;

# Client retry configuration for maximum wait interval in seconds.
const CONSTANT_RETRY_MAX_INTERVAL = 20.0d;

# HR entity.
const HR_ENTITY_NAME = "HR";

# Org details Cache key.
const BUSINESS_UNITS_CACHE_KEY = "businessUnits";

# Org details Cache key.
const COMPANIES_CACHE_KEY = "companies";