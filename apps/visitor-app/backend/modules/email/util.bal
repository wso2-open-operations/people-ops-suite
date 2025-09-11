// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/mime;

# Bind values to the email template and encode.
#
# + content - Email content  
# + keyValPairs - Key value pairs
# + return - Email content
public isolated function bindKeyValues(string content, map<string> keyValPairs) returns string|error {

    string bindContent = keyValPairs.entries().reduce(
        isolated function(string accumulation, [string, string] keyVal) returns string {
        string:RegExp r = re `<!-- \[${keyVal[0].toUpperAscii()}\] -->`;
        return r.replaceAll(accumulation, keyVal[1]);
    },
    content);
    return mime:base64Encode(bindContent).ensureType();

}
