interface CandidateStatusEmailData {
    full_name: string;
    position: string;
    status: string;
    feedback?: string;
    interview_date?: string;
    interview_time?: string;
    interview_location?: string;
  }
  
  /**
   * Template email untuk notifikasi status kandidat diterima
   */
  function candidateAcceptedEmail(req: CandidateStatusEmailData): string {
    const interviewSection = req.interview_date ? `
      <div style="font-size: 14pt; margin-bottom:20px; margin-top: 20px;">
        <p>Kami mengundang Anda untuk mengikuti interview pada:</p>
        <p>Tanggal: ${req.interview_date}</p>
        <p>Waktu: ${req.interview_time || 'Akan dikonfirmasi lebih lanjut'}</p>
        <p>Lokasi: ${req.interview_location || 'Akan dikonfirmasi lebih lanjut'}</p>
        <p>Mohon konfirmasi kehadiran Anda dengan membalas email ini.</p>
      </div>
    ` : '';
  
    return `<!DOCTYPE html">
      <html>
      <head>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
          <link href="https://getbootstrap.com/docs/5.3/assets/css/docs.css" rel="stylesheet">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>PT Amerta Indah Otsuka - Selamat! Anda Lolos Seleksi</title>
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
                                          Selamat! Anda Lolos Seleksi</h3><br>
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
                                              Terima kasih telah melamar untuk posisi ${req.position} di PT. Amerta Indah Otsuka.
                                          </td>
                                      </tr>
                                      <tr>
                                          <td
                                              style="padding-left:30px; padding-right:30px; padding-top: 20px; font-family: Nunito, sans-serif; font-size: 14px;">
                                              Kami dengan senang hati memberitahukan bahwa Anda telah lolos seleksi awal untuk posisi ini.
                                          </td>
                                      </tr>
                                      ${interviewSection}
                                      <tr>
                                          <td>
                                              <p style="padding-left:30px; margin: 0;">Terima kasih atas ketertarikan Anda untuk bergabung bersama tim kami!</p>
                                              <p style="padding-left:30px;  margin: 0; padding-top: 20px;">Salam,</p>
                                              <p style="padding-left:30px;  margin: 0;">Tim Talent Acquisition</p>
                                              <p style="padding-left:30px;  margin: 0; padding-bottom: 30px;">PT Amerta Indah Otsuka</p>
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
  
  /**
   * Template email untuk notifikasi status kandidat ditolak
   */
  function candidateRejectedEmail(req: CandidateStatusEmailData): string {
    const feedbackSection = req.feedback 
      ? `<div style="font-size: 14pt; margin-bottom:20px; margin-top: 20px;">
          <p>Feedback dari tim rekrutmen kami:</p>
          <p>${req.feedback}</p>
        </div>`
      : '';
  
    return `<!DOCTYPE html">
      <html>
      <head>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
          <link href="https://getbootstrap.com/docs/5.3/assets/css/docs.css" rel="stylesheet">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>PT Amerta Indah Otsuka - Update Status Lamaran</title>
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
                                          Update Status Lamaran</h3><br>
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
                                              Terima kasih telah melamar untuk posisi ${req.position} di PT. Amerta Indah Otsuka.
                                          </td>
                                      </tr>
                                      <tr>
                                          <td
                                              style="padding-left:30px; padding-right:30px; padding-top: 20px; font-family: Nunito, sans-serif; font-size: 14px;">
                                              Setelah pertimbangan yang matang, kami memutuskan untuk tidak melanjutkan proses rekrutmen dengan Anda untuk posisi ini.
                                          </td>
                                      </tr>
                                      ${feedbackSection}
                                      <tr>
                                          <td
                                              style="padding-left:30px; padding-right:30px; padding-top: 20px; font-family: Nunito, sans-serif; font-size: 14px;">
                                              Meskipun demikian, kami menghargai ketertarikan Anda pada perusahaan kami dan mendorong Anda untuk melamar posisi lain yang sesuai di masa depan.
                                          </td>
                                      </tr>
                                      <tr>
                                          <td>
                                              <p style="padding-left:30px; margin: 0; padding-top: 20px;">Salam,</p>
                                              <p style="padding-left:30px;  margin: 0;">Tim Talent Acquisition</p>
                                              <p style="padding-left:30px;  margin: 0; padding-bottom: 30px;">PT Amerta Indah Otsuka</p>
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
  
  /**
   * Fungsi untuk mendapatkan template email berdasarkan status kandidat
   */
  function candidateStatusEmail(req: CandidateStatusEmailData): string {
    if (req.status === 'accepted') {
      return candidateAcceptedEmail(req);
    } else {
      return candidateRejectedEmail(req);
    }
  }
  
  export { candidateStatusEmail, candidateAcceptedEmail, candidateRejectedEmail };