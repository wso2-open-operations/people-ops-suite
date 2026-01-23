// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;
import par_app.utils;

import ballerina/http;

# Maintanance Interceptor returns maintenance status.
public isolated service class MaintananceInterceptor {

    *http:RequestInterceptor;

    isolated resource function 'default [string... path](http:RequestContext ctx)
            returns http:ServiceUnavailable|http:NextService|error? {
        if isMaintenanceMode {
            types:MaintenanceStatus maintenanceStatus = {
                isMaintenanceMode,
                maintenanceMessage
            };
            return utils:createServiceUnavailableResponse(maintenanceStatus.toJsonString());
        }
        return ctx.next();
    }
}
