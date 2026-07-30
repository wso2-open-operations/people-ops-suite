# Email template for the Marked-leaver auto-transition summary notification.
# Placeholders: APP_NAME, RUN_DATE, COUNT, EMPLOYEE_LIST, YEAR
public final string leaverAutoTransitionSummaryTemplate = string `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>WSO2 <!-- [APP_NAME] --></title>
    <style type="text/css">
      @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap");
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      table {
        border-collapse: collapse;
      }
      img {
        outline: none;
        text-decoration: none;
        border: 0;
      }
      p {
        margin: 1em 0;
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
      <tbody>
        <tr>
          <td align="center" valign="top">

            <!-- HEADER -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                max-width:650px;
                background-color:#ff7300;
                background-image:url('https://wso2.cachefly.net/wso2/sites/all/2022-optimized/bg-hr-mailer-new.png');
                background-size:auto;
                background-repeat:no-repeat;
                background-position:top;
              "
            >
              <tbody>
                <tr>
                  <td style="padding:30px 20px;">
                    <a href="https://wso2.com/" style="text-decoration:none;" target="_blank">
                      <img
                        src="https://wso2.cachefly.net/wso2/sites/all/image_resources/logos/WSO2-Logo-White.png"
                        alt="WSO2 Logo"
                        height="40"
                        width="100"
                        style="height:auto; width:150px;"
                      />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- BODY -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                max-width:650px;
                background-color:#ffffff;
                margin:auto;
                box-shadow:0px 0px 26px 0 rgba(0,0,0,0.15);
              "
            >
              <tbody>
                <tr>
                  <td style="padding:30px 40px;">

                    <!-- Info Banner -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tbody>
                        <tr>
                          <td
                            style="
                              background-color:#e8f4fd;
                              border-left:4px solid #2b7de9;
                              padding:14px 16px;
                              border-radius:4px;
                            "
                          >
                            <p
                              style="
                                margin:0;
                                font-family:'Roboto', Helvetica, sans-serif;
                                font-size:14px;
                                color:#1a4c7a;
                              "
                            >
                              <strong>Automated Offboarding Update</strong> &mdash;
                              <!-- [COUNT] --> employee(s) reached their final day of employment on
                              <!-- [RUN_DATE] --> and were automatically transitioned from
                              <em>Marked leaver</em> to <em>Left</em>.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:16px;
                        color:#465868;
                        margin-top:24px;
                      "
                    >
                      Hi Admin,<br /><br />
                      The following employees were auto-transitioned to <strong>Left</strong> status. No action is
                      required unless one of these transitions looks incorrect.
                    </p>

                    <!-- Transitioned Employees -->
                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:15px;
                        color:#465868;
                        font-weight:bold;
                        margin-bottom:4px;
                        margin-top:20px;
                      "
                    >
                      Transitioned Employees:
                    </p>
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        border:1px solid #e0e0e0;
                        border-radius:4px;
                        margin-top:8px;
                      "
                    >
                      <tbody>
                        <tr>
                          <td
                            style="
                              padding:12px 16px;
                              font-family:'Roboto', Helvetica, sans-serif;
                              font-size:14px;
                              color:#465868;
                            "
                          >
                            <ul style="margin:0; padding-left:20px;">
                              <!-- [EMPLOYEE_LIST] -->
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:14px;
                        color:#465868;
                        margin-top:24px;
                      "
                    >
                      Best regards,<br />
                      <!-- [APP_NAME] --> System
                    </p>

                  </td>
                </tr>
              </tbody>
            </table>

            <!-- FOOTER -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px; margin:auto;">
              <tbody>
                <tr>
                  <td style="padding:20px 40px; text-align:center;">
                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:12px;
                        color:#999999;
                        margin:0;
                      "
                    >
                      &copy; <!-- [YEAR] --> WSO2 LLC. This is an automated notification from the <!-- [APP_NAME] --> System.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;
