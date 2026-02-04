// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import people_sync.peopleHr;

public function main() returns error? {
    peopleHr:Employee[] peopleHrEmployees = check peopleHr:getEmployees();
    // TODO: Continue the sync process
}
