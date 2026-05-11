// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerinax/java.jdbc;
import ballerinax/mysql;
import ballerinax/mysql.driver as _;

configurable string encryptionKey = ?;
configurable DbClientConfig dbClientConfig = ?;

final jdbc:Client dbClient = check initDbClient();

# This function is used to initialize the database client.
#
# + return - The database client instance or an error
function initDbClient() returns mysql:Client|error => new (...dbClientConfig);
