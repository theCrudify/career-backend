import { Response, Request } from "express";
import { db } from "../../utils/db";

const convertBigIntToString = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

// Controller untuk mendapatkan daftar lowongan yang tersedia
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse query parameters untuk filter
    const status = req.query.status as string; // Filter berdasarkan status lowongan (active/inactive)
    const department = req.query.department as string; // Filter berdasarkan departemen
    const site = req.query.site as string; // Filter berdasarkan lokasi/site
    const education = req.query.education as string; // Filter berdasarkan pendidikan
    const search = req.query.search as string; // Pencarian berdasarkan posisi
    const isActive = req.query.is_active as string; // Filter berdasarkan status aktif/nonaktif
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Mulai membangun query
    let query = `
      SELECT 
        jr.id,
        jr.company,
        comp.company as company_name,
        jr.department as department_id,
        dep.department as department_name,
        jr.position,
        jr.employee_number,
        jr.site as site_id,
        site.site_description as site_name,
        jr.level as level_id,
        lvl.level_description as level_name,
        jr.status,
        jr.placement_date,
        jr.reason,
        jr.replacement_name,
        jr.budget,
        jr.hiring_type,
        jr.education as education_id,
        edu.description as education_name,
        jr.gpa,
        jr.min_experience,
        jr.business_type,
        jr.specific_skill,
        jr.gender,
        jr.age,
        jr.marital_status,
        jr.job_function,
        jr.location,
        jr.description,
        jr.status_requisition,
        jr.total_approve,
        jr.approver,
        jr.is_active,
        jr.publish_date,
        jr.views,
        jr.expired_date,
        jr.budget_reason,
        jr.created_at,
        jr.created_by,
        (SELECT COUNT(cl.id) FROM tr_candidate_list cl WHERE cl.requisition_id = jr.id) as total_applicants
      FROM tr_job_requisition jr
      LEFT JOIN mst_company comp ON jr.company = comp.id
      LEFT JOIN mst_department dep ON jr.department = dep.id
      LEFT JOIN mst_site site ON jr.site = site.id
      LEFT JOIN mst_level lvl ON jr.level = lvl.id
      LEFT JOIN mst_education edu ON jr.education = edu.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter berdasarkan status aktif/nonaktif
    if (isActive) {
      query += ` AND jr.is_active = ?`;
      params.push(parseInt(isActive));
    }

    // Filter berdasarkan status lowongan
    if (status) {
      query += ` AND jr.status = ?`;
      params.push(status);
    }

    // Filter berdasarkan departemen
    if (department) {
      query += ` AND jr.department = ?`;
      params.push(parseInt(department));
    }

    // Filter berdasarkan site/lokasi
    if (site) {
      query += ` AND jr.site = ?`;
      params.push(parseInt(site));
    }

    // Filter berdasarkan pendidikan
    if (education) {
      query += ` AND jr.education = ?`;
      params.push(parseInt(education));
    }

    // Pencarian berdasarkan posisi
    if (search) {
      query += ` AND jr.position LIKE ?`;
      params.push(`%${search}%`);
    }

    // Menambahkan ordering berdasarkan tanggal dibuat
    query += ` ORDER BY jr.created_at DESC`;

    // Mengambil total data untuk pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tr_job_requisition jr
      LEFT JOIN mst_department dep ON jr.department = dep.id
      LEFT JOIN mst_site site ON jr.site = site.id
      WHERE 1=1
    `;

    const countParams: any[] = [...params]; // Copy params untuk query count

    // Copy semua filter dari query utama ke query count
    if (isActive) countQuery += ` AND jr.is_active = ?`;
    if (status) countQuery += ` AND jr.status = ?`;
    if (department) countQuery += ` AND jr.department = ?`;
    if (site) countQuery += ` AND jr.site = ?`;
    if (education) countQuery += ` AND jr.education = ?`;
    if (search) countQuery += ` AND jr.position LIKE ?`;

    // Menambahkan pagination ke query utama
    query += ` LIMIT ?, ?`;
    params.push(offset, limit);

    // Eksekusi query untuk mendapatkan data
    const vacancies = await db.$queryRawUnsafe(query, ...params);
    const sanitizedData = convertBigIntToString(vacancies);

    // Eksekusi query untuk mendapatkan total data
    const countResult = await db.$queryRawUnsafe(countQuery, ...countParams);
    const totalItems = parseInt((countResult as any)[0].total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    // Ambil data untuk dropdown filter
    // Departemen
    const departments = await db.mst_department.findMany({
      where: { is_aktif: 1 },
      select: {
        id: true,
        department: true
      },
      orderBy: { department: 'asc' }
    });

    // Site/Lokasi
    const sites = await db.mst_site.findMany({
      where: { is_aktif: 1 },
      select: {
        id: true,
        site_description: true
      },
      orderBy: { site_description: 'asc' }
    });

    // Pendidikan
    const educations = await db.mst_education.findMany({
      where: { is_aktif: 1 },
      select: {
        id: true,
        description: true
      },
      orderBy: { id: 'asc' }
    });

    // Level
    const levels = await db.mst_level.findMany({
      where: { is_aktif: 1 },
      select: {
        id: true,
        level_description: true
      },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({ 
      message: "Job vacancies retrieved successfully",
      data: sanitizedData,
      filters: {
        departments,
        sites,
        educations,
        levels
      },
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error("Error fetching job vacancies:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller untuk membuat lowongan baru
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      company,
      department,
      position,
      employee_number,
      site,
      level,
      status,
      placement_date,
      reason,
      replacement_name,
      budget,
      hiring_type,
      education,
      gpa,
      min_experience,
      business_type,
      specific_skill,
      gender,
      age,
      marital_status,
      job_function,
      location,
      description,
      status_requisition,
      publish_date,
      expired_date,
      budget_reason,
      pic_job,
      file_org,
      file_mpr,
      created_by
    } = req.body;

    // Validasi data yang diperlukan
    if (!position || !department || !site || !level || !education) {
      return res.status(400).json({ 
        error: "Missing required fields. Position, department, site, level, and education are required." 
      });
    }

    // Membuat lowongan baru
    const newVacancy = await db.tr_job_requisition.create({
      data: {
        company: company ? parseInt(company) : null,
        department: department ? parseInt(department) : null,
        position,
        employee_number: employee_number ? parseInt(employee_number) : null,
        site: site ? parseInt(site) : null,
        level: level ? parseInt(level) : null,
        status,
        placement_date: placement_date ? new Date(placement_date) : null,
        reason,
        replacement_name,
        budget: budget ? parseInt(budget) : null,
        hiring_type,
        education: education ? parseInt(education) : null,
        gpa,
        min_experience,
        business_type,
        specific_skill,
        gender,
        age,
        marital_status,
        job_function,
        location,
        description,
        status_requisition: status_requisition || "Draft",
        total_approve: 0,
        is_active: 1,
        publish_date: publish_date ? new Date(publish_date) : new Date(),
        expired_date: expired_date ? new Date(expired_date) : null,
        budget_reason,
        pic_job: pic_job ? parseInt(pic_job) : null,
        file_org,
        file_mpr,
        created_at: new Date(),
        created_by
      }
    });

    // Log pembuatan lowongan
    await db.tr_job_log.create({
      data: {
        requisition_id: newVacancy.id,
        position_name: position,
        action: "Create",
        reason: "Create new job vacancy",
        status: "Created",
        created_at: new Date(),
        created_by: created_by ? parseInt(created_by) : null
      }
    });

    return res.status(201).json({
      message: "Job vacancy created successfully",
      data: newVacancy
    });
  } catch (error) {
    console.error("Error creating job vacancy:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};