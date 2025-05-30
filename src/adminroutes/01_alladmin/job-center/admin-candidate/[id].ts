import { Response, Request } from "express";
import { db } from "../../../../utils/db";
import { sendEmailNotification } from "../../../../template/EmailController";

/**
 * Konversi BigInt ke string untuk memastikan kompatibilitas JSON
 */
const convertBigIntToString = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

/**
 * Helper function untuk normalize file path
 */
const normalizeFilePath = (filePath: string | null): string | null => {
  if (!filePath) return null;
  
  // Remove leading slash if exists
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  
  // If path already starts with proper format, return as is
  if (cleanPath.startsWith('app/public/')) {
    return cleanPath;
  }
  
  // If path starts with upload/, add app/public/ prefix
  if (cleanPath.startsWith('upload/')) {
    return `app/public/${cleanPath}`;
  }
  
  // Default format for other paths
  return `app/public/upload/${cleanPath}`;
};

// Template email untuk notifikasi status kandidat
function candidateStatusEmail(data: {
  full_name: string;
  position: string;
  status: string;
  feedback?: string;
  interview_date?: string;
  interview_time?: string;
  interview_location?: string;
}): string {
  const statusMessage = data.status === 'accepted' 
    ? 'Kami dengan senang hati memberitahukan bahwa Anda telah diterima untuk posisi ini.'
    : 'Setelah pertimbangan yang matang, kami memutuskan untuk tidak melanjutkan proses rekrutmen untuk posisi ini.';
  
  const feedbackSection = data.feedback 
    ? `<div style="font-size: 14pt; margin-bottom:10px">
        <p>Feedback dari tim rekrutmen kami:</p>
        <p>${data.feedback}</p>
      </div>`
    : '';

  const interviewSection = (data.interview_date && data.interview_time && data.interview_location)
    ? `<div style="font-size: 14pt; margin-bottom:10px">
        <p>Kami ingin mengundang Anda untuk wawancara pada:</p>
        <p>Tanggal: ${data.interview_date}</p>
        <p>Waktu: ${data.interview_time}</p>
        <p>Lokasi: ${data.interview_location}</p>
        <p>Mohon konfirmasi kehadiran Anda dengan membalas email ini.</p>
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
 * Mendapatkan detail kandidat termasuk pengalaman, skill, dan riwayat
 */
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const candidateListId = Number(req.params.id);

  try {
    // Ambil data utama kandidat
    const candidateDataQuery = `
      SELECT 
        cl.id as candidateListId,
        cl.requisition_id as jobId,
        cl.candidate_id as candidateRegId,
        cl.status_candidate as statusCode,
        sc.status as statusName,
        sc.type as statusType,
        cl.created_at as applyDate,
        jr.position as jobPosition,
        jr.department as departmentId,
        dep.department as departmentName,
        jr.site as siteId,
        site.site_description as siteName,
        cr.full_name,
        cr.email,
        cr.phone_number,
        cr.birth_date,
        TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) as age,
        cr.gender,
        cr.marital_status,
        cr.religion,
        cr.domicile_province,
        prov.province as provinceName,
        cr.domicile_city,
        city.name as cityName,
        cr.domicile_address,
        cr.education as educationId,
        edu.description as educationName,
        cr.institution,
        cr.major,
        cr.year_of_graduation,
        cr.score,
        cr.expected_salary,
        cr.is_fresh_graduate,
        cr.file_foto,
        cr.cv,
        cr.file_ktp,
        cr.file_kk,
        cr.file_npwp,
        cr.file_rekening,
        cr.file_bpjs_kerja,
        cr.file_bpjs_sehat,
        cr.file_transkrip,
        cr.file_sim_a,
        cr.file_sim_c,
        cr.file_ijazah,
        cr.file_foto_formal,
        cr.file_skck,
        cr.emergency_contact_name,
        cr.emergency_contact_status,
        cr.emergency_contact_number
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      JOIN mst_status_candidate sc ON cl.status_candidate = sc.id
      LEFT JOIN mst_department dep ON jr.department = dep.id
      LEFT JOIN mst_site site ON jr.site = site.id
      LEFT JOIN mst_education edu ON cr.education = edu.id
      LEFT JOIN mst_province prov ON cr.domicile_province = prov.id
      LEFT JOIN mst_city city ON cr.domicile_city = city.name
      WHERE cl.id = ?
    `;

    // Ambil pengalaman kerja kandidat
    const experiencesQuery = `
      SELECT 
        id,
        experience_company,
        experience_position,
        experience_salary,
        experience_start_date,
        experience_end_date,
        experience_job_level,
        experience_description,
        is_currently_working
      FROM tr_experience_candidate
      WHERE id_candidate = (
        SELECT candidate_id FROM tr_candidate_list WHERE id = ?
      )
      ORDER BY experience_start_date DESC
    `;

    // Ambil skill kandidat
    const skillsQuery = `
      SELECT 
        id,
        skill,
        skill_rate
      FROM tr_skill_candidate
      WHERE id_candidate = (
        SELECT candidate_id FROM tr_candidate_list WHERE id = ?
      )
    `;

    // Ambil sosial media kandidat
    const socialMediaQuery = `
      SELECT 
        id,
        platform,
        account
      FROM tr_social_media
      WHERE candidate_id = (
        SELECT candidate_id FROM tr_candidate_list WHERE id = ?
      )
    `;

    // Ambil riwayat perubahan status kandidat
    const statusHistoryQuery = `
      SELECT 
        id,
        candidate_list_id,
        action,
        result,
        status_candidate,
        created_at,
        created_by
      FROM tr_candidate_log
      WHERE candidate_list_id = ?
      ORDER BY created_at DESC
    `;

    // Ambil riwayat interview
    const interviewHistoryQuery = `
      SELECT 
        id,
        candidate_list_id,
        status_candidate,
        interviewer,
        plan_date,
        plan_time,
        location,
        note,
        created_at,
        created_by,
        interview_type
      FROM tr_interview
      WHERE candidate_list_id = ?
      ORDER BY plan_date DESC, created_at DESC
    `;

    // Eksekusi semua query
    const candidateData = await db.$queryRawUnsafe(candidateDataQuery, candidateListId);
    const experiences = await db.$queryRawUnsafe(experiencesQuery, candidateListId);
    const skills = await db.$queryRawUnsafe(skillsQuery, candidateListId);
    const socialMedia = await db.$queryRawUnsafe(socialMediaQuery, candidateListId);
    const statusHistory = await db.$queryRawUnsafe(statusHistoryQuery, candidateListId);
    const interviewHistory = await db.$queryRawUnsafe(interviewHistoryQuery, candidateListId);

    // Convert BigInt to string untuk semua hasil
    const sanitizedCandidateData = convertBigIntToString(candidateData);
    const sanitizedExperiences = convertBigIntToString(experiences);
    const sanitizedSkills = convertBigIntToString(skills);
    const sanitizedSocialMedia = convertBigIntToString(socialMedia);
    const sanitizedStatusHistory = convertBigIntToString(statusHistory);
    const sanitizedInterviewHistory = convertBigIntToString(interviewHistory);

    // Jika kandidat tidak ditemukan
    if (!sanitizedCandidateData || sanitizedCandidateData.length === 0) {
      return res.status(404).json({ 
        message: "Candidate not found" 
      });
    }

    // Normalize file paths untuk semua dokumen
    const candidate = sanitizedCandidateData[0];
    const fileFields = [
      'file_foto', 'cv', 'file_ktp', 'file_kk', 'file_npwp', 
      'file_transkrip', 'file_ijazah', 'file_foto_formal', 
      'file_skck', 'file_bpjs_kerja', 'file_bpjs_sehat', 
      'file_rekening', 'file_sim_a', 'file_sim_c'
    ];
    
    fileFields.forEach(field => {
      if (candidate[field]) {
        candidate[field] = normalizeFilePath(candidate[field]);
      }
    });

    // Menghitung total pengalaman kerja (dalam bulan)
    let totalExperienceMonths = 0;
    sanitizedExperiences.forEach((exp: any) => {
      const startDate = new Date(exp.experience_start_date);
      const endDate = exp.is_currently_working === "1" ? 
        new Date() : // Jika masih bekerja, gunakan tanggal saat ini
        (exp.experience_end_date ? new Date(exp.experience_end_date) : new Date());
      
      // Hitung selisih bulan
      const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth());
      
      totalExperienceMonths += diffMonths > 0 ? diffMonths : 0;
    });

    // Format total pengalaman dalam tahun dan bulan
    const experienceYears = Math.floor(totalExperienceMonths / 12);
    const experienceMonths = totalExperienceMonths % 12;
    const totalExperience = `${experienceYears} tahun ${experienceMonths} bulan`;

    // Jika status adalah "unread", otomatis ubah menjadi "read"
    if (sanitizedCandidateData[0].statusCode === 1) {
      await db.tr_candidate_list.update({
        where: { id: candidateListId },
        data: { 
          status_candidate: 2 // Status "Read"
        }
      });

      // Catat log perubahan status
      await db.tr_candidate_log.create({
        data: {
          candidate_list_id: candidateListId,
          action: "Mark as Read",
          result: "Candidate profile viewed by admin",
          status_candidate: "2",
          created_at: new Date(),
        }
      });

      // Update statusCode dan statusName di response
      sanitizedCandidateData[0].statusCode = 2;
      sanitizedCandidateData[0].statusName = "Read";
    }

    // Return response dengan semua data yang telah diambil
    return res.status(200).json({
      message: "Candidate details retrieved successfully",
      data: {
        candidateDetail: sanitizedCandidateData[0],
        experiences: sanitizedExperiences,
        skills: sanitizedSkills,
        socialMedia: sanitizedSocialMedia,
        totalExperience: totalExperience,
        totalExperienceMonths: totalExperienceMonths,
        statusHistory: sanitizedStatusHistory,
        interviewHistory: sanitizedInterviewHistory
      }
    });
  } catch (error) {
    console.error("Error fetching candidate details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Mengubah status kandidat dan mengirim notifikasi email jika diperlukan
 */
export const updateStatus = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const candidateListId = Number(req.params.id);
  const { status, feedback, user_id } = req.body;

  try {
    // Validate required fields
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Verify candidate exists
    const candidate = await db.tr_candidate_list.findUnique({
      where: { id: candidateListId },
      include: {
        job_requisition: true
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate application not found" });
    }

    // Update status
    const updatedCandidate = await db.tr_candidate_list.update({
      where: { id: candidateListId },
      data: {
        status_candidate: parseInt(status),
        updated_at: new Date()
      }
    });

    // Log the status change
    await db.tr_candidate_log.create({
      data: {
        candidate_list_id: candidateListId,
        action: `Status updated to ${status}`,
        result: feedback || "",
        status_candidate: status.toString(),
        created_at: new Date(),
        created_by: user_id ? parseInt(user_id) : null
      }
    });

    // Send email notification for accepted (10) or rejected (12) status
    if (status === '10' || status === '12') {
      try {
        // Get candidate data for email
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
        
        const candidateResult = await db.$queryRawUnsafe(candidateQuery, candidateListId);
        
        if (!candidateResult || (candidateResult as any[]).length === 0) {
          console.error("Failed to get candidate data for email notification");
          return res.status(200).json({ 
            message: 'Candidate status updated, but email notification failed: candidate data not found', 
            updatedCandidate,
            emailSent: false
          });
        }
        
        const candidateData = (candidateResult as any[])[0];
        
        // Prepare email content
        const emailContent = candidateStatusEmail({
          full_name: candidateData.full_name || '',
          position: candidateData.position || '',
          status: status === '10' ? 'accepted' : 'rejected',
          feedback: feedback
        });

        // Prepare email data
        const emailData = {
          subject: status === '10' ? "Selamat! Anda Diterima" : "Update Status Lamaran",
          to: candidateData.email || '',
          text: "",
          body: emailContent,
        };

        // Send email notification
        console.log(`Attempting to send ${status === '10' ? 'acceptance' : 'rejection'} email to: ${candidateData.email}`);
        
        const emailSent = await sendEmailNotification(emailData);

        if (!emailSent) {
          console.error(`Failed to send email notification to candidate: ${candidateData.email}`);
          return res.status(200).json({ 
            message: 'Candidate status updated successfully, but email notification failed', 
            updatedCandidate,
            emailSent: false
          });
        }
        
        console.log(`Successfully sent ${status === '10' ? 'acceptance' : 'rejection'} email to: ${candidateData.email}`);
        return res.status(200).json({ 
          message: 'Candidate status updated successfully and notification sent', 
          updatedCandidate,
          emailSent: true
        });
      } catch (emailError) {
        console.error("Error in email notification process:", emailError);
        return res.status(200).json({ 
          message: 'Candidate status updated successfully, but email notification failed', 
          updatedCandidate,
          emailSent: false,
          emailError: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    // For statuses other than accepted/rejected
    return res.status(200).json({
      message: "Candidate status updated successfully",
      data: updatedCandidate
    });
  } catch (error) {
    console.error("Error updating candidate status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Menjadwalkan interview untuk kandidat
 */
export const scheduleInterview = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const candidateListId = Number(req.params.id);
  const { interview_date, interview_time, interview_location, interviewer, notes, user_id } = req.body;

  // Validasi data interview
  if (!interview_date || !interview_time || !interview_location) {
    return res.status(400).json({ error: 'Interview date, time, and location are required' });
  }

  try {
    // Ubah status kandidat menjadi "Invited for Interview" (kode status 3)
    await db.tr_candidate_list.update({
      where: { id: candidateListId },
      data: { 
        status_candidate: 3 // Status "Invited for Interview"
      }
    });

    // Catat jadwal interview di database
    const interviewPlanDate = new Date(interview_date);
    
    const interview = await db.tr_interview.create({
      data: {
        candidate_list_id: candidateListId,
        status_candidate: 3,
        interviewer: interviewer || "",
        plan_date: interviewPlanDate,
        plan_time: interview_time,
        is_fix: "1", // Fixed schedule
        note: notes || "",
        location: interview_location,
        created_at: new Date(),
        created_by: user_id ? String(user_id) : null,
        interview_type: "Online" // Default ke online, bisa diganti sesuai kebutuhan
      }
    });

    // Log aktivitas ini
    await db.tr_candidate_log.create({
      data: {
        candidate_list_id: candidateListId,
        action: "Schedule Interview",
        location: interview_location,
        result: "",
        status_candidate: "3",
        created_at: new Date(),
        plan_date: interviewPlanDate,
        created_by: user_id ? parseInt(user_id) : null
      }
    });

    // Ambil data kandidat untuk email
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
    
    const candidateResult = await db.$queryRawUnsafe(candidateQuery, candidateListId);
    
    if (candidateResult && (candidateResult as any[]).length > 0) {
      const candidateData = (candidateResult as any[])[0];
      
      // Format tanggal untuk email
      const formattedDate = interviewPlanDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Kirim email undangan interview
      const emailContent = candidateStatusEmail({
        full_name: candidateData.full_name || "",
        position: candidateData.position || "",
        status: "accepted",
        interview_date: formattedDate,
        interview_time: interview_time,
        interview_location: interview_location
      });

      const emailData = {
        subject: "Undangan Interview - PT Amerta Indah Otsuka",
        to: candidateData.email || "",
        text: "",
        body: emailContent
      };

      try {
        await sendEmailNotification(emailData);
      } catch (emailError) {
        console.error("Failed to send interview invitation email:", emailError);
        // Tidak throw error, hanya log saja
      }
    }

    return res.status(200).json({
      message: 'Interview scheduled successfully',
      interview
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};