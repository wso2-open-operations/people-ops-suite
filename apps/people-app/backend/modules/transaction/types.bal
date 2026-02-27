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

# OAuth2 client auth configurations.
public type ClientAuthConfig record {|
    # Token URL
    string tokenUrl;
    # Client Id
    string clientId;
    # Client Secret
    string clientSecret;
|};

# Transaction status payload.
public type TransactionStatusPayload record {|
    # Transaction hash (0x-prefixed).
    string txHash;
    # Whether the transaction was found and mined.
    boolean found;
    # Whether the transaction executed successfully.
    boolean success;
    # Human-readable status: SUCCESS, FAILED, or PENDING.
    string status;
    # Block number the transaction was mined in, or () if pending.
    int? blockNumber;
    # Number of blocks mined after this transaction.
    int confirmations;
|};

# Response from transaction service.
public type TransactionStatusResponse record {|
    # API response message.
    string message;
    # HTTP status code of the response.
    int httpCode;
    # Transaction confirmation status.
    TransactionStatusPayload payload;
|};
