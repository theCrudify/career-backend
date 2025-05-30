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

/**
 * Mendapatkan daftar kandidat dengan berbagai filter
 */
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse query parameters untuk filter
    const job_id = req.query.job_id as string; 
    const status = req.query.status as string; 
    const search = req.query.search as string; 
    const education = req.query.education as string; 
    const experience = req.query.experience as string; 
    const age_min = req.query.age_min as string; 
    const age_max = req.query.age_max as string; 
    const apply_date_start = req.query.apply_date_start as string; 
    const apply_date_end = req.query.apply_date_end as string; 
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Sorting
    const sort_by = req.query.sort_by as string || 'cl.created_at'; 
    const sort_dir = req.query.sort_dir as string || 'desc'; 

    // Log untuk debugging
    console.log("Search parameter:", search);
    
    // Mulai membangun query
    let query = `
      SELECT 
        cl.id,
        cr.id as candidate_id,
        cr.full_name,
        cr.email,
        cr.phone_number,
        cr.file_foto,
        jr.id as job_id,
        jr.position,
        cl.created_at as apply_date,
        cl.status_candidate,
        sc.status as status_name,
        sc.type as status_type,
        cr.education,
        ed.description as education_name,
        cr.expected_salary,
        TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) as age,
        (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) as experience_count,
        (SELECT MAX(plan_date) FROM tr_interview i WHERE i.candidate_list_id = cl.id) as last_interview_date
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      LEFT JOIN mst_status_candidate sc ON cl.status_candidate = sc.id
      LEFT JOIN mst_education ed ON cr.education = ed.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter berdasarkan ID lowongan
    if (job_id) {
      query += ` AND cl.requisition_id = ?`;
      params.push(parseInt(job_id));
    }

    // Filter berdasarkan status kandidat
    if (status) {
      query += ` AND cl.status_candidate = ?`;
      params.push(parseInt(status));
    }

    // Pencarian berdasarkan nama atau email - PERBAIKAN
    if (search && search.trim() !== '') {
      // Gunakan LIKE dengan case insensitive
      query += ` AND (LOWER(cr.full_name) LIKE LOWER(?) OR LOWER(cr.email) LIKE LOWER(?))`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Filter berdasarkan pendidikan
    if (education) {
      query += ` AND cr.education = ?`;
      params.push(education);
    }

    // Filter berdasarkan pengalaman
    if (experience === 'yes') {
      query += ` AND (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) > 0`;
    } else if (experience === 'no') {
      query += ` AND (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) = 0`;
    }

    // Filter berdasarkan usia
    if (age_min) {
      query += ` AND TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) >= ?`;
      params.push(parseInt(age_min));
    }
    if (age_max) {
      query += ` AND TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) <= ?`;
      params.push(parseInt(age_max));
    }

    // Filter berdasarkan tanggal melamar
    if (apply_date_start) {
      query += ` AND DATE(cl.created_at) >= ?`;
      params.push(apply_date_start);
    }
    if (apply_date_end) {
      query += ` AND DATE(cl.created_at) <= ?`;
      params.push(apply_date_end);
    }

    // Menambahkan ordering
    query += ` ORDER BY ${sort_by} ${sort_dir}`;

    // Mengambil total data untuk pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE 1=1
    `;

    const countParams: any[] = [...params]; // Copy params untuk query count

    // Copy semua filter dari query utama ke query count (kecuali LIMIT dan ORDER BY)
    if (job_id) countQuery += ` AND cl.requisition_id = ?`;
    if (status) countQuery += ` AND cl.status_candidate = ?`;
    if (search && search.trim() !== '') {
      countQuery += ` AND (LOWER(cr.full_name) LIKE LOWER(?) OR LOWER(cr.email) LIKE LOWER(?))`;
    }
    if (education) countQuery += ` AND cr.education = ?`;
    if (experience === 'yes') countQuery += ` AND (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) > 0`;
    else if (experience === 'no') countQuery += ` AND (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) = 0`;
    if (age_min) countQuery += ` AND TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) >= ?`;
    if (age_max) countQuery += ` AND TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) <= ?`;
    if (apply_date_start) countQuery += ` AND DATE(cl.created_at) >= ?`;
    if (apply_date_end) countQuery += ` AND DATE(cl.created_at) <= ?`;

    // Log untuk debugging
    console.log("Final SQL query:", query);
    console.log("Query parameters:", params);

    // Menambahkan pagination ke query utama
    query += ` LIMIT ?, ?`;
    params.push(offset, limit);

    // Eksekusi query untuk mendapatkan data
    const candidates = await db.$queryRawUnsafe(query, ...params);
    const sanitizedData = convertBigIntToString(candidates);

    // Normalize file paths untuk file_foto
    sanitizedData.forEach((candidate: any) => {
      if (candidate.file_foto) {
        candidate.file_foto = normalizeFilePath(candidate.file_foto);
      }
    });

    // Eksekusi query untuk mendapatkan total data
    const countResult = await db.$queryRawUnsafe(countQuery, ...countParams);
    const totalItems = parseInt((countResult as any)[0].total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    // Ambil status kandidat untuk filter
    const statuses = await db.mst_status_candidate.findMany({
      select: {
        id: true,
        status: true,
        type: true
      },
      orderBy: { seq: 'asc' }
    });

    // Ambil lowongan yang tersedia untuk filter
    const jobsQuery = `
      SELECT 
        id, 
        position,
        status,
        department,
        expired_date
      FROM tr_job_requisition
      WHERE is_active = 1
      ORDER BY created_at DESC
    `;
    
    const jobs = await db.$queryRawUnsafe(jobsQuery);
    const sanitizedJobs = convertBigIntToString(jobs);

    // Ambil daftar pendidikan untuk filter
    const educations = await db.mst_education.findMany({
      where: { is_aktif: 1 },
      select: {
        id: true,
        description: true
      },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({ 
      message: "Candidates retrieved successfully",
      data: sanitizedData,
      filters: {
        jobs: sanitizedJobs,
        statuses,
        educations
      },
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Update status kandidat secara massal
 */
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { candidate_ids, status, feedback, user_id } = req.body;

    // Validasi data yang diperlukan
    if (!candidate_ids || !candidate_ids.length || !status) {
      return res.status(400).json({ 
        error: "Missing required fields. Candidate IDs and status are required." 
      });
    }

    // Validasi status yang diinput
    if (!['1', '2', '3', '5', '6', '7', '8', '10'].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status code" 
      });
    }

    // Update status kandidat
    const updateResults = [];
    const timestamp = new Date();

    for (const id of candidate_ids) {
      try {
        // Update status kandidat
        const updatedCandidate = await db.tr_candidate_list.update({
          where: { id: parseInt(id) },
          data: { 
            status_candidate: parseInt(status)
          }
        });

        // Catat log perubahan status
        await db.tr_candidate_log.create({
          data: {
            candidate_list_id: parseInt(id),
            action: "Bulk Status Update",
            result: feedback || "",
            status_candidate: status,
            created_at: timestamp,
            created_by: user_id ? parseInt(user_id) : null
          }
        });

        updateResults.push({
          id: id,
          success: true,
          message: "Status updated successfully"
        });
      } catch (error) {
        console.error(`Error updating candidate ${id}:`, error);
        updateResults.push({
          id: id,
          success: false,
          message: "Failed to update status"
        });
      }
    }

    // Hitung statistik hasil operasi
    const successCount = updateResults.filter(result => result.success).length;
    const failureCount = updateResults.filter(result => !result.success).length;

    return res.status(200).json({
      message: `Updated ${successCount} candidates successfully, ${failureCount} failed`,
      results: updateResults
    });
  } catch (error) {
    console.error("Error updating candidate statuses:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Mendapatkan daftar kandidat yang belum dibaca (unread)
 */
export const getUnread = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Mengambil daftar kandidat yang belum dibaca (status_candidate = 1)
    const unreadCandidates = await db.$queryRaw`
      SELECT 
        cl.id,
        cr.full_name,
        cr.email,
        cr.file_foto,
        jr.position,
        cl.created_at as apply_date,
        cl.status_candidate,
        sc.status as status_name
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      JOIN mst_status_candidate sc ON cl.status_candidate = sc.id
      WHERE cl.status_candidate = 1
      ORDER BY cl.created_at DESC
    `;

    const sanitizedData = convertBigIntToString(unreadCandidates);

    // Normalize file paths
    sanitizedData.forEach((candidate: any) => {
      if (candidate.file_foto) {
        candidate.file_foto = normalizeFilePath(candidate.file_foto);
      }
    });

    return res.status(200).json({ 
      message: "Unread candidates retrieved successfully",
      data: sanitizedData
    });
  } catch (error) {
    console.error("Error fetching unread candidates:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Mendapatkan statistik kandidat
 */
export const getStatistics = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Filter parameter optional
  const position = req.query.position as string;
  const startDate = req.query.start_date as string;
  const endDate = req.query.end_date as string;

  try {
    // Base query dengan parameter yang akan ditambahkan
    let statsQueryParams: any[] = [];
    let statsWhereClause = "";

    // Filter by position
    if (position) {
      statsWhereClause += " AND jr.position LIKE ?";
      statsQueryParams.push(`%${position}%`);
    }

    // Filter by date range
    if (startDate && endDate) {
      statsWhereClause += " AND cl.created_at BETWEEN ? AND ?";
      statsQueryParams.push(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      statsWhereClause += " AND cl.created_at >= ?";
      statsQueryParams.push(new Date(startDate));
    } else if (endDate) {
      statsWhereClause += " AND cl.created_at <= ?";
      statsQueryParams.push(new Date(endDate));
    }

    // Query untuk jumlah kandidat berdasarkan status
    const statusCountsQuery = `
      SELECT 
        sc.id as status_id,
        sc.status as status_name,
        sc.type as status_type,
        COUNT(cl.id) as count
      FROM mst_status_candidate sc
      LEFT JOIN tr_candidate_list cl ON sc.id = cl.status_candidate
        ${statsWhereClause ? "AND" + statsWhereClause.substring(4) : ""}
      LEFT JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      GROUP BY sc.id, sc.status, sc.type
      ORDER BY sc.seq
    `;

    // Query untuk jumlah kandidat berdasarkan posisi yang dilamar
    const positionCountsQuery = `
      SELECT 
        jr.position,
        COUNT(cl.id) as count
      FROM tr_job_requisition jr
      LEFT JOIN tr_candidate_list cl ON jr.id = cl.requisition_id
      WHERE jr.is_active = 1
        ${statsWhereClause}
      GROUP BY jr.position
      ORDER BY count DESC
      LIMIT 10
    `;

    // Query untuk kandidat baru per hari (last 30 days)
    const dailyApplicationsQuery = `
      SELECT 
        DATE(cl.created_at) as date,
        COUNT(cl.id) as count
      FROM tr_candidate_list cl
      LEFT JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE cl.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${statsWhereClause}
      GROUP BY DATE(cl.created_at)
      ORDER BY date ASC
    `;

    // Query untuk mendapatkan total kandidat
    const totalCandidatesQuery = `
      SELECT COUNT(cl.id) as total
      FROM tr_candidate_list cl
      LEFT JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE 1=1
        ${statsWhereClause}
    `;

    // Eksekusi semua query
    const statusCounts = await db.$queryRawUnsafe(statusCountsQuery, ...statsQueryParams);
    const positionCounts = await db.$queryRawUnsafe(positionCountsQuery, ...statsQueryParams);
    const dailyApplications = await db.$queryRawUnsafe(dailyApplicationsQuery, ...statsQueryParams);
    const totalCandidatesResult = await db.$queryRawUnsafe(totalCandidatesQuery, ...statsQueryParams);

    // Convert BigInt to string
    const sanitizedStatusCounts = convertBigIntToString(statusCounts);
    const sanitizedPositionCounts = convertBigIntToString(positionCounts);
    const sanitizedDailyApplications = convertBigIntToString(dailyApplications);
    const totalCandidates = convertBigIntToString(totalCandidatesResult)[0].total;

    // Hitung persentase untuk status
    let totalStatusCount = 0;
    sanitizedStatusCounts.forEach((status: any) => {
      totalStatusCount += parseInt(status.count);
    });

    const statusWithPercentage = sanitizedStatusCounts.map((status: any) => {
      const count = parseInt(status.count);
      const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
      return {
        ...status,
        percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
      };
    });

    return res.status(200).json({
      message: "Candidate statistics retrieved successfully",
      data: {
        totalCandidates,
        statusCounts: statusWithPercentage,
        positionCounts: sanitizedPositionCounts,
        dailyApplications: sanitizedDailyApplications
      }
    });
  } catch (error) {
    console.error("Error fetching candidate statistics:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Mengubah status kandidat dan mengirim notifikasi email jika diperlukan
 */
// Update candidate status
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
        
        // Use direct imports instead of require
        // This is important to note that we're using the candidateStatusEmail function 
        // that's defined in this same file, not importing from elsewhere
        
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
        
        // Use the imported sendEmailNotification from the module path without require
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
