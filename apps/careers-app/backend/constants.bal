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

# Cache key of employees.
const string EMPLOYEES_CACHE_KEY = "employees";

# Cache key of customers.
const string CUSTOMERS_CACHE_KEY = "customers";

# Regex for non-empty printable string (at least one visible char)
public const NONE_EMPTY_PRINTABLE_STRING_REGEX = "^(?:.*\\S)[ -~]+$";

# Regex for email validation
public const REGEX_EMAIL = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

# Regex for phone number (9–15 digits only)
public const REGEX_PHONE_NUMBER = "^\\+?[0-9]{1,4}(\\s?[0-9]{2,4}){1,4}$";

# URL validation for professional links
public const REGEX_URL = "https?://[^\\s]+";
