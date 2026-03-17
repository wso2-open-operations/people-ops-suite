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
# + masterWalletAddress - Expected recipient address
# + expectedAmount - Expected coins amount to be paid for the reservation
# + return - () on success, error if not found/failed or recipient/amount mismatch
public isolated function confirmTransaction(string txHash, string masterWalletAddress, decimal expectedAmount)
        returns error? {
    http:Response response = check transactionClient->/api/v1/blockchain/get\-transaction\-details/[txHash].get();

    if response.statusCode != http:STATUS_OK {
        json|error errBody = response.getJsonPayload();
        json errInfo = errBody is json ? errBody : errBody.message();
        return error(string `Transaction confirmation failed for hash ${txHash}`, statusCode =
            response.statusCode, info = errInfo);
    }

    json jsonPayload = check response.getJsonPayload();

    TransactionDetailsResponse parsed = check jsonPayload.cloneWithType(TransactionDetailsResponse);

    TransactionDetailsPayload payload = parsed.payload;
    if !payload.found {
        return error("Transaction not found on-chain.");
    }
    if payload.txDetails is () {
        return error("Transaction details missing; cannot verify recipient.");
    }
    TxDetailsToRecord|error detailsParsed = payload.txDetails.cloneWithType(TxDetailsToRecord);
    if detailsParsed is error {
        return error("Transaction details invalid; cannot verify recipient.");
    }
    string? toAddress = detailsParsed.'to;
    if toAddress is () {
        return error("Transaction 'to' address missing or invalid.");
    }
    if toAddress.toLowerAscii() != masterWalletAddress.toLowerAscii() {
        return error(string `Transaction recipient does not match master wallet.`);
    }
    string amountFormatted = payload.amountFormatted;
    if amountFormatted is () {
        return error("Transaction amount missing; cannot verify.");
    }
    decimal actualAmount = check decimal:fromString(amountFormatted);
    if actualAmount != expectedAmount {
        return error("Transaction amount does not match expected reservation amount.");
    }
    if !payload.success || payload.status != SUCCESS {
        return error(string `Transaction not successful: ${payload.status}.`);
    }

    return ();
}
