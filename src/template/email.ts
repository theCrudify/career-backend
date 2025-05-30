interface CandidateRegisterEmailData {
    full_name: string;
    id: number;
  }

interface CandidateApplyEmailData {
    full_name: string;
    position: string;
  }

  interface forgotPasswordEmailData{
    id: number
  }
  
  function candidateRegisterEmail(req: CandidateRegisterEmailData): string {
    return `<!DOCTYPE html">
      <html>
      <head>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
          <link href="https://getbootstrap.com/docs/5.3/assets/css/docs.css" rel="stylesheet">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Help - Email Verification</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css?family=Nunito:400,600,700,800,900&display=swap" rel="stylesheet">
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
          </head>
    
      <body style="margin: 0; padding: 0; box-sizing: border-box; background-color: #FDF8F4;">
          <table align="center" cellpadding="0" cellspacing="0" width="95%" style="margin-top: 100px;">
              <tr>
                  <td align="center">
                      <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-spacing: 2px 5px;"
                          bgcolor="#fff">
                          <tr>
                              <td bgcolor="#fff">
                                  <table class="card" style="border:none; padding-top: 30px;" cellpadding="0"
                                      cellspacing="0" width="100%%">
                                      <tr>
                                          <td>
                                          <h3
                                          style=" padding-left:30px; margin-top:0;font-size:14px;line-height:1.3;font-weight:bold;letter-spacing:-0.02em;">
                                          Activate your RISE Account</h3><br>
                                          </td>
                                      </tr>
                                      <tr>
                                      <td>
                                          <p style="float:left; padding-left:30px;font-size:16px;"> Hi, ${req.full_name}</p>
                                          </td>
                                          </tr>           
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td bgcolor="#fff">
                                  <table class="card" style="border: none;" cellpadding="0" cellspacing="0" width="100%%">
                                      <tr>
                                          <td
                                              style="padding-left:30px; padding-right:30px; font-family: Nunito, sans-serif; font-size: 14px;">
                                              Yay! Thank you for registering an account with PT. Amerta Indah Otsuka! Before we proceed, we kindly ask you to verify your email address.
                                          </td>
                                      </tr>
                                      <tr>
                                          <td
                                              style="padding: 20px 0 20px 0; font-family: Nunito, sans-serif; font-size: 16px; text-align: center;">
                                              <button style="background: #DE4D3B; text-decoration: none; padding-top:5px;
                                                  padding-bottom: 5px; padding-left: 10px;padding-right: 10px;
                                                  text-align: center; display: inline-block; color: #ffffff;
                                                  border-radius: 48px;border: none;
                                                  font-family: Nunito, sans-serif; font-size: 18px; font-weight: bold;
                                                  cursor: pointer;">
                                                  <a style="font-size:12px; color:white; text-decoration:none;"
                                                      href="${process.env.PREFIX_FRONTEND}/career/#/email-confirmed/${req.id}">
                                                      Verify Email Address
                                                  </a> </button>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td>
                                              <p style="padding-left:30px; margin: 0;">Thank for using our application</p>
                                              <p style="padding-left:30px;  margin: 0;">Thanks,</p>
                                              <p style="padding-left:30px;  margin: 0;">PT Amerta Indah Otsuka</p>
                                          </td>
                                      </tr>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
          </td>
          </tr>
          </table>
      </body>
    
     </html>`;
  }

  function candidateApplyEmail(req: CandidateApplyEmailData): string{
    return `
    <head>
      <meta charset="UTF-8">
      <meta name="apple-mobile-web-app-title" content="Email">
      <title></title>
      <script>
      window.console = window.console || function(t) {};
    </script>
      <script>
      if (document.location.search.match(/type=embed/gi)) {
        window.parent.postMessage("resize", "*");
      }
    </script>
    
    
    </head>
    <body translate="no" style="margin:0;padding:0;word-spacing:normal;background-color:#FDF8F4;">
    
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="date=no">
      <meta name="format-detection" content="telephone=no">
      <style type="text/CSS"></style>
      <style @import="" url('https:="" dopplerhealth.com="" fonts="" basiercircle="" basiercircle-regular-webfont.woff2');=""></style>
      <title></title>
      <style>
        table,
        td,
        div,
        h1,
        p {
          font-family: 'Basier Circle', 'Roboto', 'Helvetica', 'Arial', sans-serif;
        }
    
        @media screen and (max-width: 530px) {
          .unsub {
            display: block;
            padding: 8px;
            margin-top: 14px;
            border-radius: 6px;
            background-color: #FFEADA;
            text-decoration: none !important;
            font-weight: bold;
          }
    
          .button {
            min-height: 42px;
            line-height: 42px;
          }
    
          .col-lge {
            max-width: 100% !important;
          }
        }
    
        @media screen and (min-width: 531px) {
          .col-sml {
            max-width: 27% !important;
          }
    
          .col-lge {
            max-width: 73% !important;
          }
        }
      </style>
    
    
    
      <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#FDF8F4;">
        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
          <tbody><tr>
            <td align="center" style="padding:0;">
              <!--[if mso]>
              <table role="presentation" align="center" style="width:600px;">
              <tr>
              <td>
              <![endif]-->
              <table role="presentation" style="width:94%;max-width:600px;border:none;border-spacing:0;text-align:left;font-family:'Basier Circle', 'Roboto', 'Helvetica', 'Arial', sans-serif;font-size:1em;line-height:1.37em;color:#384049;">
                <!--      Logo headder -->
                <tbody>
                <tr>
                  <td style="padding:30px;background-color:#ffffff;">
                    <p style="font-size: 16pt; font-weight: 500;">Dear ${req.full_name},</p>
                    <div style="font-size: 14pt; margin-bottom:10px">
                        <p>Terima kasih atas ketertarikan Anda untuk berkarir bersama kami pada posisi (${req.position}). Lamaran Anda akan
                            kami proses apabila memenuhi kriteria dan persyaratan yang sesuai dengan posisi ini.</p>
                    </div>
                    <div style="font-size: 14pt; margin-bottom:10px">
                        <p>Adapun dengan banyaknya pelamar yang sangat banyak, mohon dapat dipahami kami hanya akan memberitahukan
                            kepada kandidat yang terpilih.</p>
                    </div>
                    <div style="font-size: 14pt; margin-bottom:30px">
                        <p>Kandidat terpilih akan dihubungi secara langsung oleh Team Talent Acquisition kami baik melalui panggilan
                            telepon atau email apabila Anda masuk ke tahapan selanjutnya.</p>
                            <p>Anda dapat mempelajari lebih lanjut tentang PT Amerta Indah Otsuka melalui:</p>
                    </div>
                    <div style="font-size: 14pt; margin-bottom:10px; line-height: 3pt;">
                        <p>Website: <a href="https://www.aio.co.id/">www.aio.co.id</a></p>
                        <p>Instagram: @otsuka.id</p>
                        <p>Tiktok: Otsuka.id</p>
                        <p>LinkedIn: PT Amerta Indah Otsuka</p>
                    </div>
                    <div style="font-size: 14pt; margin-bottom:30px; margin-top: 30px;">
                        <p>Sekali lagi terima kasih atas ketertarikan Anda untuk bergabung bersama tim kami!</p>
                    </div>
                    <div style="font-size: 14pt; margin-bottom:10px; line-height: 3pt;">
                        <p>Regards</p>
                        <p>Your Talent Acquisition Team.</p>
                    </div>
                  </td>
                </tr>
              </tbody></table>
              <!--[if mso]>
              </td>
              </tr>
              </table>
              <![endif]-->
            </td>
          </tr>
        </tbody></table>
      </div> 
    </body>`
  }

  function forgotPasswordEmail (req: forgotPasswordEmailData) : string {
    return `<!DOCTYPE html">
    <html>
    
    <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://getbootstrap.com/docs/5.3/assets/css/docs.css" rel="stylesheet">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css?family=Nunito:400,600,700,800,900&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    </head>
    
    <body style="margin: 0; padding: 0; box-sizing: border-box; background-color: #FDF8F4;">
        <table align="center" cellpadding="0" cellspacing="0" width="95%" style="margin-top: 100px;">
            <tr>
                <td align="center">
                    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-spacing: 2px 5px;"
                        bgcolor="#fff">
                        <tr>
                            <td bgcolor="#fff">
                                <table class="card" style="border: none;" cellpadding="0" cellspacing="0" width="100%%">
                                  <tr>
                                  <td style="font-weight: bold; padding-top:20px; padding-left:30px; padding-right:30px; font-family: Nunito, sans-serif; font-size: 15px;"> Reset your RISE Password Account
                                  </td>
                                  </tr>
                                    <tr>
                                        <td
                                            style="padding-top:20px; padding-left:30px; padding-right:30px; padding-bottom:10px; font-family: Nunito, sans-serif; font-size: 14px;">
                                            Forgot your password?
                                        </td>
    
                                    </tr>
                                    <tr>
                                        <td
                                            style="padding-left:30px; padding-right:30px; font-family: Nunito, sans-serif; font-size: 14px;">
                                            We received a request to reset the RISE account password To reset your password,
                                            please click the reset
                                            password button
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style="padding: 20px 0 20px 0; font-family: Nunito, sans-serif; font-size: 16px; text-align: center;">
                                            <button style="background: #DE4D3B; text-decoration: none; padding-top:5px;
                                                            padding-bottom: 5px; padding-left: 10px;padding-right: 10px;
                                                            text-align: center; display: inline-block; color: #ffffff;
                                                            border-radius: 48px;border: none;
                                                            font-family: Nunito, sans-serif; font-size: 18px; font-weight: bold;
                                                            cursor: pointer;">
                                                <a style="font-size:12px; color:white; text-decoration:none;"
                                                    href = "${process.env.PREFIX_FRONTEND}/career/#/reset-password/${req.id}">
                                                    Reset Password
                                                </a> </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <p
                                                style="padding-left:30px;margin: 0; padding-right:30px; font-family: Nunito, sans-serif; font-size: 14px;">
                                                Thank
                                                for using our application</p>
                                            <p style="padding-left:30px;margin: 0; padding-right:30px; font-family: Nunito,
                                                sans-serif; font-size: 14px;">
                                                Thanks,</p>
                                            <p style="padding-left:30px;margin: 0; padding-right:30px; font-family: Nunito,
                                                sans-serif; font-size: 14px;">
                                                PT
                                                Amerta Indah Otsuka</p>
                                        </td>
                                    </tr>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        </td>
        </tr>
        </table>
    </body>      
    </html>
    `
  }
  
  export { candidateRegisterEmail, candidateApplyEmail, forgotPasswordEmail };
  