// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerinax/googleapis.sheets as sheets;

configurable MenuSheet menuSheetClientConfig = ?;

final sheets:ConnectionConfig sheetsConfig = {
    auth: {
        clientId: menuSheetClientConfig.clientId,
        clientSecret: menuSheetClientConfig.clientSecret,
        refreshToken: menuSheetClientConfig.refreshToken,
        refreshUrl: menuSheetClientConfig.tokenUrl
    },
    retryConfig: {
        count: GSHEET_CONFIG_RETRY_COUNT,
        interval: GSHEET_CONFIG_RETRY_INTERVAL
    }
};

# Create Google Sheets client.
public final sheets:Client spreadsheetClient = check new (sheetsConfig);
