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

# Transaction details payload.
public type TransactionDetailsPayload record {|
    # Transaction hash (0x-prefixed).
    string txHash;
    # Whether the node knows this transaction.
    boolean found;
    # True when mined and executed successfully.
    boolean success;
    # One of TransactionStatus values.
    string status;
    # ISO-8601 block time, or () if not mined/unknown.
    string? timestamp;
    # Readable token amount for transfer, or ().
    string? amountFormatted;
    # Raw provider transaction, or () when transaction not found.
    json? txDetails;
    # Decoded calldata when ABI matches, otherwise ().
    json? decodedData;
|};

# Decoded transaction data for recipient validation.
public type DecodedDataForRecipient record {
    # Decoded function name (e.g., transfer).
    string name;
    # Decoded argument list.
    string[] args;
};

# Response envelope.
public type TransactionDetailsResponse record {|
    # API response message.
    string message;
    # HTTP status code of the response.
    int httpCode;
    # Transaction details payload.
    TransactionDetailsPayload payload;
|};

# Transaction status from get-transaction-details API.
public enum TransactionStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    PENDING = "PENDING",
    NOT_FOUND = "NOT_FOUND"
}
