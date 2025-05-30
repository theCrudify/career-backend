import { Response, Request } from "express";
import { db } from "../../utils/db";

const convertBigIntToString = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse query parameters untuk filter
    const job_id = req.query.job_id as string; // Filter berdasarkan ID lowongan
    const status = req.query.status as string; // Filter berdasarkan status kandidat
    const search = req.query.search as string; // Pencarian berdasarkan nama atau email
    const education = req.query.education as string; // Filter berdasarkan pendidikan
    const experience = req.query.experience as string; // Filter berdasarkan pengalaman (yes/no)
    const age_min = req.query.age_min as string; // Filter berdasarkan usia minimum
    const age_max = req.query.age_max as string; // Filter berdasarkan usia maksimum
    const apply_date_start = req.query.apply_date_start as string; // Filter tanggal lamar awal
    const apply_date_end = req.query.apply_date_end as string; // Filter tanggal lamar akhir
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Sorting
    const sort_by = req.query.sort_by as string || 'cl.created_at'; 
    const sort_dir = req.query.sort_dir as string || 'desc'; 
    
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
        cr.education,
        ed.description as education_name,
        cr.expected_salary,
        TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) as age,
        (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) as experience_count
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      JOIN mst_status_candidate sc ON cl.status_candidate = sc.id
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

    // Pencarian berdasarkan nama atau email
    if (search) {
      query += ` AND (cr.full_name LIKE ? OR cr.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
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
    if (search) countQuery += ` AND (cr.full_name LIKE ? OR cr.email LIKE ?)`;
    if (education) countQuery += ` AND cr.education = ?`;
    if (experience === 'yes') countQuery += ` AND (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) > 0`;
    else if (experience === 'no') countQuery += ` AND (SELECT COUNT(*) FROM tr_experience_candidate ec WHERE ec.id_candidate = cr.id) = 0`;
    if (age_min) countQuery += ` AND TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) >= ?`;
    if (age_max) countQuery += ` AND TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) <= ?`;
    if (apply_date_start) countQuery += ` AND DATE(cl.created_at) >= ?`;
    if (apply_date_end) countQuery += ` AND DATE(cl.created_at) <= ?`;

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

    // Ambil daftar lowongan yang tersedia untuk filter
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

    // Ambil daftar status kandidat untuk filter
    const statusQuery = `
      SELECT 
        id, 
        status,
        type
      FROM mst_status_candidate
      ORDER BY seq ASC
    `;
    
    const statuses = await db.$queryRawUnsafe(statusQuery);
    const sanitizedStatuses = convertBigIntToString(statuses);

    // Ambil daftar pendidikan untuk filter
    const educationQuery = `
      SELECT 
        id, 
        description
      FROM mst_education
      WHERE is_aktif = 1
      ORDER BY id ASC
    `;
    
    const educations = await db.$queryRawUnsafe(educationQuery);
    const sanitizedEducations = convertBigIntToString(educations);

    return res.status(200).json({ 
      message: "Candidates retrieved successfully",
      data: sanitizedData,
      filters: {
        jobs: sanitizedJobs,
        statuses: sanitizedStatuses,
        educations: sanitizedEducations
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
};