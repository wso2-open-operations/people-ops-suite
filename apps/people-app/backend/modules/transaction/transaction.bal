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
import ballerina/http;

# Confirms the transaction from the transaction hash.
#
# + txHash - Transaction hash
# + return - () on success, error if not found/failed
public isolated function confirmTransaction(string txHash) returns error? {
    http:Response response = check transactionClient->/api/v1/blockchain/confirm\-transaction/[txHash].get();

    if response.statusCode != http:STATUS_OK {
        json|error errBody = response.getJsonPayload();
        json errInfo = errBody is json ? errBody : errBody.message();
        return error(string `Transaction confirmation failed for hash ${txHash}`, statusCode =
            response.statusCode, info = errInfo);
    }

    json|error jsonPayload = response.getJsonPayload();
    if jsonPayload is error {
        return jsonPayload;
    }

    TransactionStatusResponse|error parsed = jsonPayload.cloneWithType(TransactionStatusResponse);
    if parsed is error {
        return parsed;
    }

    TransactionStatusPayload payload = parsed.payload;
    if !payload.found {
        return error("Transaction not found on-chain.");
    }
    if !payload.success || payload.status != TRANSACTION_STATUS_SUCCESS {
        return error(string `Transaction not successful: ${payload.status}.`);
    }

    return ();
}
