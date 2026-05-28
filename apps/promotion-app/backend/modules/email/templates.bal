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
public final string reminderTemplate = string `
<div style="text-align: left">
  <p
    class="cDottedline"
    style="
      font-family: 'Roboto', Helvetica, sans-serif;
      padding-bottom: 5px;
      font-size: 17px;
      line-height: 28px;
      padding-top: 40px;
      padding-left: 0;
      padding-right: 0;
      color: #465868;
      text-align: left;
      border-top: 2px dotted #c3c5c9;
      margin-top: 0;
    "
  >
    Hi <!-- [RECIPIENT_NAME] -->,
  </p>

  <p>
    This is a reminder that the deadline for submitting Promotion Applications
    for your team/s is approaching. Please ensure that you complete and submit
    the promotion details for eligible team members before the deadline.
  </p>

  <p>
    Please note that once the deadline passes, the system will close, and
    further submissions will no longer be possible.
  </p>

  <p>
    <b>Submission Deadline:</b>
    <!-- [DEADLINE] -->
  </p>

  <p>
    <b>Remaining Days:</b>
    <!-- [REMAINING_DAYS] -->
  </p>

  <p style="font-size: 16px; margin: 0px; line-height: 26px">
    If you have any questions about the Promotion process or need assistance
    in completing the submission, please do not hesitate to reach out to the
    People Operations Team.
  </p>

  <p>
    Click
    <a
      href="<!-- [PROMOTION_APP_LINK] -->"
      target="_blank"
      style="color: rgb(255, 115, 0); text-decoration-line: none"
    >
      here
    </a>
    to access the Promotion App.
    <br />
    Click
    <a
      href="<!-- [USER_GUIDE_LINK] -->"
      target="_blank"
      style="color: rgb(255, 115, 0); text-decoration-line: none"
    >
      here
    </a>
    to access the User Guide.
  </p>
</div>
`;