// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerinax/googleapis.sheets as sheets;

configurable DodSheet sheetClientConfig = ?;

public final sheets:ConnectionConfig sheetsConfig = {
    auth: {
        clientId: sheetClientConfig.clientId,
        clientSecret: sheetClientConfig.clientSecret,
        refreshToken: sheetClientConfig.refreshToken,
        refreshUrl: sheetClientConfig.tokenUrl
    },
    retryConfig: {
        count: GSHEET_CONFIG_RETRY_COUNT,
        interval: GSHEET_CONFIG_RETRY_INTERVAL
    }
};

# Create Google Sheets client
public final sheets:Client spreadsheetClient = check new (sheetsConfig);
