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

# The largest CV accepted, in bytes.
public const int MAX_CV_BYTES = 5 * 1024 * 1024;

# The largest request body accepted. The multipart body carries the CV plus the form fields, so this sits a little
# above the CV limit.
public const int MAX_REQUEST_BYTES = 6 * 1024 * 1024;

# The fields the careers app submits when someone applies, with the CV's raw bytes.
public type ApplicationForm record {|
    # Applicant's first name
    string firstName;
    # Applicant's last name
    string lastName;
    # Applicant's personal email address
    string email;
    # Phone number in international (E.164) format
    string phone;
    # Postal address
    string address;
    # The CV (a PDF file)
    byte[] cv;
|};
