ALTER TABLE hris_par_rating
ADD COLUMN par_rating_shared_by VARCHAR(60) AFTER par_rating_updated_by;

ALTER TABLE hris_par_cycle
ADD COLUMN par_f2f_deadline DATE AFTER par_special_rating_deadline;

ALTER TABLE hris_par_rating
ADD COLUMN par_performance_notice_ack BLOB AFTER par_admin_comment;

ALTER TABLE hris_par_rating
ADD COLUMN par_special_rating_eligibility BOOLEAN DEFAULT TRUE AFTER par_performance_notice_ack;

ALTER TABLE hris_par_special_rating_quota
ADD COLUMN par_allowed_leads TEXT DEFAULT NULL AFTER par_top20_quota;

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_360_NOTIFICATION'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLETE_360_NOTIFICATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_360_REMINDER'
WHERE
    (`par_config_key` = 'EMAIL_TEMPLETE_360_REMINDER');

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_EMPLOYEE_REMINDER'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLETE_EMPLOYEE_REMINDER'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_EMPLOYEE_SHARED_NOTIFICATION'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLETE_EMPLOYEE_SHARED_NOTIFICATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_LEAD_OVERDUE_REMINDER'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLETE_LEAD_OVERDUE_REMINDER'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_LEAD_REMINDER'
WHERE
    (`par_config_key` = 'EMAIL_TEMPLETE_LEAD_REMINDER');

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_LEAD_SHARED_NOTIFICATION'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLETE_LEAD_SHARED_NOTIFICATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_PAR_INVITATION'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLETE_PAR_INVITATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_key` = 'EMAIL_TEMPLATE_SPECIAL_RATING_REMINDER'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLETE_SPECIAL_RATING_REMINDER'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
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
      You are invited to provide feedback for <b>
        <!-- [EMPLOYEE_NAME] -->
      </b>
      as part of their performance review.<br />
      Please ensure that you complete and share 360 reviews before the deadline.
    </p>

    <p>
      This process aims to collect diverse perspectives to create a well-rounded
      assessment. Your feedback will be accessible to the team lead and People
      Operations team.
    </p>
    <p>
      Please ensure your comments are professional, constructive, and detailed to
      add meaningful insights. To accept the invitation and share your feedback or
      decline the request, click
      <!-- [ADDITIONAL_DATA] -->.
    </p>

    <p>
      <b>Submission Deadline:</b>
      <!-- [DEADLINE] -->
    </p>
    <p>
      <b>Remaining Days:</b>
      <!-- [REMAINING_DAYS] -->
    </p>
  </div>
'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLATE_360_NOTIFICATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
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
      This is a reminder that the deadline for submitting 360 reviews for your
      colleagues is approaching. Please ensure that you complete and share 360
      reviews before the deadline.
    </p>

    <p>
      <b>Submission Deadline:</b>
      <!-- [DEADLINE] -->
    </p>
    <p>
      <b>Remaining Days:</b>
      <!-- [REMAINING_DAYS] -->
    </p>

    <p><b>Reviewees</b></p>
    <p>
      <!-- [ADDITIONAL_DATA] -->
    </p>

    <p style="font-size: 16px; margin: 0px; line-height: 26px">
      If you have any questions about the PAR process or need assistance in
      completing your review, please do not hesitate to reach out to the People
      Operations Team.
    </p>
    <p>
      Click
      <a
        href="https://par-hris.wso2.com/"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the PAR App. <br />
      Click
      <a
        href="<!-- [USER_GUIDE_LINK] -->"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the User Guide.
    </p>
  </div>
'
WHERE
    (`par_config_key` = 'EMAIL_TEMPLATE_360_REMINDER');

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
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
      This is a reminder that the deadline for submitting your Performance
      Appraisal Review (PAR) is approaching. Please ensure that your PAR is
      completed and shared before the deadline. Please note that once the deadline
      passes, the system will close, and further submissions will no longer be
      possible.
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
      If you have any questions about the PAR process or need assistance in
      completing your review, please do not hesitate to reach out to the People
      Operations Team.
    </p>
    <p></p>
    <p>
      Click
      <a
        href="https://par-hris.wso2.com/"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the PAR App. <br />
      Click
      <a
        href="<!-- [USER_GUIDE_LINK] -->"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the User Guide.
    </p>
  </div>
'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLATE_EMPLOYEE_REMINDER'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
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
      <!-- [EMPLOYEE_NAME] --> has completed their PAR and shared it with you.
    </p>
    <p>
      To view and add your feedback, please click
      <a
        href="<!-- [EMPLOYEE_PAR_LINK] -->"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >.
    </p>
  </div>
'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLATE_EMPLOYEE_SHARED_NOTIFICATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
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
      This is to inform you that the deadline for submitting Performance Appraisal
      Reviews (PAR) for your team/s has passed. Please ensure that you complete
      and share PARs of your team as soon as possible.
    </p>

    <p style="color: red">
      <b>Par Cycle:</b>
      <!-- [PAR_CYCLE_NAME] -->
    </p>
    <p style="color: red">
      <b>Submission Deadline:</b>
      <!-- [DEADLINE] -->
    </p>
    <p style="color: red">
      <b>Remaining Days:</b>
      <!-- [REMAINING_DAYS] -->
    </p>

    <p><b>Details</b></p>
    <p>
      <!-- [ADDITIONAL_DATA] -->
    </p>

    <p>
      If you have any questions about the PAR process or need assistance in
      completing your review, please do not hesitate to reach out to the People
      Operations Team (POT).
    </p>
  </div>
'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLATE_LEAD_OVERDUE_REMINDER'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
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
      This is a reminder that the deadline for submitting Performance Appraisal
      Reviews (PAR) for your team/s is approaching. Please ensure that you
      complete and share PARs of your team before the deadline.
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

    <p><b>Details</b></p>
    <div style="padding: 10px;">
      <style>
        div th {
          padding: inherit !important;
        }
      </style>
      <p>
        <!-- [ADDITIONAL_DATA] -->
      </p>
    </div>


    <p style="font-size: 16px; margin: 0px; line-height: 26px">
      If you have any questions about the PAR process or need assistance in
      completing your review, please do not hesitate to reach out to the People
      Operations Team.
    </p>
    <p>
      Click
      <a
        href="https://par-hris.wso2.com/"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the PAR App. <br />
      Click
      <a
        href="<!-- [USER_GUIDE_LINK] -->"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the User Guide.
    </p>
  </div>
'
WHERE
    (`par_config_key` = 'EMAIL_TEMPLATE_LEAD_REMINDER');

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
        padding-right: 0;
        color: #465868;
        text-align: left;
        border-top: 2px dotted #c3c5c9;
        margin-top: 0;
      "
    >
      Hi
      <!-- [RECIPIENT_NAME] -->,
    </p>

    <p>
      Your Performance Appraisal Review (PAR) has been completed and shared by
      your team lead.
    </p>

    <p>
      Please schedule a F2F chat with your lead to go over the feedback in detail.
      Once your chat is completed, please update the system on the same.
    </p>

    <p>
      Click
      <a
        href="https://par-hris.wso2.com/"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the PAR App. <br />
      Click
      <a
        href="<!-- [USER_GUIDE_LINK] -->"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the User Guide.
    </p>
  </div>
'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLATE_LEAD_SHARED_NOTIFICATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
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

    <p
      style="
        font-size: 16px;
        margin: 0px;
        line-height: 26px;
        padding-bottom: 10px;
      "
    >
      It is time for the
      <!-- [PAR_CYCLE_NAME] -->. All details on the PARs, ratings, and filling the
      PAR forms are updated
      <a
        href="<!-- [SLIDES_LINK] -->"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >.
    </p>

    <p>Please take note of the important dates related to this PAR cycle:</p>

    <div style="display: flex; justify-content: center;">
      <table>
        <thead>
          <tr style="background-color: #e8eaed; text-align: center">
            <th style="padding: 10px">Employee PAR Submission Deadline</th>
            <th style="padding: 10px">360 Submission Deadline</th>
            <th style="padding: 10px">Lead PAR Submission Deadline</th>
            <th style="padding: 10px">F2F Deadline</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #f8f9fa">
            <td style="padding: 10px"><!-- [EMPLOYEE_DEADLINE] --></td>
            <td style="padding: 10px"><!-- [360_DEADLINE] --></td>
            <td style="padding: 10px"><!-- [LEAD_DEADLINE] --></td>
            <td style="padding: 10px"><!-- [F2F_DEADLINE] --></td>
          </tr>
        </tbody>
      </table>
    </div>

    <p></p>
    <p
      style="
        font-size: 16px;
        vertical-align: top;
        margin: 0px;
        line-height: 26px;
        color: rgb(68, 68, 68);
      "
    >
      We request that you ensure all steps in the PAR process are completed on
      time.
    </p>

    <p style="font-size: 16px; margin: 0px; line-height: 26px">
      If you have any questions about the PAR process or need assistance in
      completing your review, please do not hesitate to reach out to the People
      Operations Team.
    </p>

    <p>
      Click
      <a
        href="https://par-hris.wso2.com/"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the PAR App. <br />
      Click
      <a
        href="<!-- [USER_GUIDE_LINK] -->"
        target="_blank"
        style="color: rgb(255, 115, 0); text-decoration-line: none"
        >here</a
      >
      to access the User Guide.
    </p>
  </div>
'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLATE_PAR_INVITATION'
    );

UPDATE `hris`.`hris_par_configs`
SET
    `par_config_value` = '<div style="text-align: left">
    <p
      class="cDottedline"
      style="
        font-family: \'Roboto\', Helvetica, sans-serif;
        padding-bottom: 5px;
        font-size: 17px;
        line-height: 28px;
        padding-top: 40px;
        padding-left: 0;
        padding-right: 0;
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
      This is a gentle reminder that the deadline for submitting Special Ratings
      for your team is fast approaching. Please ensure that you assign Special
      Ratings before the deadline.
    </p>

    <p>
      <b>Par Cycle:</b>
      <!-- [PAR_CYCLE_NAME] -->
    </p>
    <p>
      <b>Submission Deadline:</b>
      <!-- [DEADLINE] -->
    </p>
    <p>
      <b>Remaining Days:</b>
      <!-- [REMAINING_DAYS] -->
    </p>

    <p>
      If you have any questions about the PAR process or need assistance in
      completing your review, please do not hesitate to reach out to the People
      Operations Team (POT).
    </p>
  </div>
'
WHERE
    (
        `par_config_key` = 'EMAIL_TEMPLATE_SPECIAL_RATING_REMINDER'
    );
