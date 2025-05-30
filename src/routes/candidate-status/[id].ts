import { Response, Request } from "express";
import { db } from "../../utils/db";
import { sendEmailNotification } from "../../template/EmailController";

// Interface untuk email notifikasi kandidat
interface CandidateStatusEmailData {
  full_name: string;
  position: string;
  status: string;
  feedback?: string;
}

// Template email untuk notifikasi status kandidat
function candidateStatusEmail(data: CandidateStatusEmailData): string {
  const statusMessage = data.status === 'accepted' 
    ? 'Kami dengan senang hati memberitahukan bahwa Anda telah diterima untuk posisi ini.'
    : 'Setelah pertimbangan yang matang, kami memutuskan untuk tidak melanjutkan proses rekrutmen untuk posisi ini.';
  
  const feedbackSection = data.feedback 
    ? `<div style="font-size: 14pt; margin-bottom:10px">
        <p>Feedback dari tim rekrutmen kami:</p>
        <p>${data.feedback}</p>
      </div>`
    : '';

  return `<!DOCTYPE html">
    <html>
    <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://getbootstrap.com/docs/5.3/assets/css/docs.css" rel="stylesheet">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>PT Amerta Indah Otsuka - Status Lamaran</title>
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
                                        Update Status Lamaran Anda</h3><br>
                                        </td>
                                    </tr>
                                    <tr>
                                    <td>
                                        <p style="float:left; padding-left:30px;font-size:16px;"> Hi, ${data.full_name}</p>
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
                                            Terima kasih telah melamar untuk posisi ${data.position} di PT. Amerta Indah Otsuka.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style="padding-left:30px; padding-right:30px; padding-top: 20px; font-family: Nunito, sans-serif; font-size: 14px;">
                                            ${statusMessage}
                                        </td>
                                    </tr>
                                    ${feedbackSection}
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

// Controller untuk mengubah status kandidat menjadi "read" (dibaca)
export const markAsRead = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const candidateId = Number(req.params.id);

  try {
    // Update status kandidat menjadi "read" (dibaca)
    const updatedCandidate = await db.tr_candidate_list.update({
      where: { id: candidateId },
      data: { 
        status_candidate: 2 // Anggap 2 adalah status "read/dibaca"
      },
    });

    return res.status(200).json({ 
      message: 'Candidate profile marked as read', 
      updatedCandidate 
    });
  } catch (error) {
    console.error('Error updating data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller untuk mengubah status kandidat (diterima/ditolak)
export const updateStatus = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const candidateId = Number(req.params.id);
  const { status, feedback } = req.body;

  // Validasi status yang diinput
  if (!status || (status !== 'accepted' && status !== 'rejected')) {
    return res.status(400).json({ error: 'Status must be either "accepted" or "rejected"' });
  }

  try {
    // Mapping status text ke status_candidate value
    const statusValue = status === 'accepted' ? 5 : 6; // Anggap 5: diterima, 6: ditolak
    
    // Update status kandidat
    const updatedCandidate = await db.tr_candidate_list.update({
      where: { id: candidateId },
      data: { 
        status_candidate: statusValue
      },
    });

    // Ambil data kandidat untuk email menggunakan raw query
    const candidateQuery = `
      SELECT 
        cl.id as candidate_list_id,
        cr.id as candidate_reg_id,
        cr.full_name,
        cr.email,
        jr.id as job_id,
        jr.position
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE cl.id = ?
    `;
    
    const candidateResult = await db.$queryRawUnsafe(candidateQuery, candidateId);
    
    if (!candidateResult || (candidateResult as any[]).length === 0) {
      return res.status(404).json({ error: 'Candidate data not found' });
    }
    
    const candidateData = (candidateResult as any[])[0];

    // Menyiapkan data untuk email
    const emailContent = candidateStatusEmail({
      full_name: candidateData.full_name || '',
      position: candidateData.position || '',
      status: status,
      feedback: feedback
    });

    // Kirim email notifikasi
    const emailData = {
      subject: status === 'accepted' ? "Selamat! Anda Diterima" : "Update Status Lamaran",
      to: candidateData.email || '',
      text: "",
      body: emailContent,
    };

    const emailSent = await sendEmailNotification(emailData);

    if (!emailSent) {
      console.error("Failed to send status notification email.");
      // Kita tetap mengembalikan success meski email gagal terkirim
      return res.status(200).json({ 
        message: 'Candidate status updated successfully, but email notification failed', 
        updatedCandidate
      });
    }

    // Log perubahan status pada tr_candidate_log
    await db.tr_candidate_log.create({
      data: {
        candidate_list_id: candidateId,
        action: status === 'accepted' ? 'Accept Candidate' : 'Reject Candidate',
        result: feedback || '',
        status_candidate: String(statusValue),
        created_at: new Date(),
        created_by: Number(req.body.user_id) || null
      }
    });

    return res.status(200).json({ 
      message: 'Candidate status updated successfully and notification sent', 
      updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan data status kandidat
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const candidateId = Number(req.params.id);

  try {
    // Gunakan raw query untuk mendapatkan data kandidat
    const candidateQuery = `
      SELECT 
        cl.id as candidate_list_id,
        cl.status_candidate,
        cr.id as candidate_reg_id,
        cr.full_name,
        cr.email,
        cr.file_foto,
        jr.id as job_id,
        jr.position
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE cl.id = ?
    `;
    
    const candidateResult = await db.$queryRawUnsafe(candidateQuery, candidateId);
    
    if (!candidateResult || (candidateResult as any[]).length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidateData = (candidateResult as any[])[0];

    // Mendapatkan status text berdasarkan status_candidate
    let statusText = 'unknown';
    switch (candidateData.status_candidate) {
      case 1:
        statusText = 'unread';
        break;
      case 2:
        statusText = 'read';
        break;
      case 5:
        statusText = 'accepted';
        break;
      case 6:
        statusText = 'rejected';
        break;
      default:
        statusText = 'in progress';
    }

    return res.status(200).json({
      candidate: {
        id: candidateData.candidate_list_id,
        name: candidateData.full_name,
        email: candidateData.email,
        photo: candidateData.file_foto,
        position: candidateData.position,
        status: statusText,
        status_code: candidateData.status_candidate
      }
    });
  } catch (error) {
    console.error('Error fetching candidate status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};