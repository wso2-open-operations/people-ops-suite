// Copyright (c) 2023, WSO2 Inc. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import employee_data_sync.types;

import ballerinax/mysql;
import ballerinax/mysql.driver as _;
import ballerinax/peoplehr;

configurable types:PeopleHrConfig peopleHrConfig = ?;
configurable types:DatabaseConfig databaseConfigPeopleHr = ?;

types:DatabaseConfigMySql people_hr = {
    ...databaseConfigPeopleHr,
    options: {
        ssl: {
            mode: mysql:SSL_REQUIRED
        },
        connectTimeout: 10
    }
};

public final mysql:Client peopleHrDatabaseClient = check new (...people_hr);
public final peoplehr:Client baseClient = check new ({apiKey: peopleHrConfig.apiKey, baseURL: peopleHrConfig.endpoint});
