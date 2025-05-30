import { Response, Request } from "express";
import { db } from "../../../../utils/db";

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