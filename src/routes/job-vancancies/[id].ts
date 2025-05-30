import { Response, Request } from "express";
import { db } from "../../utils/db";

const convertBigIntToString = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

// Mendapatkan detail lowongan
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const jobId = Number(req.params.id);

  try {
    // Query untuk mendapatkan detail lowongan
    const jobDetailQuery = `
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
        jr.pic_job,
        jr.file_org,
        jr.file_mpr,
        jr.created_at,
        jr.created_by,
        (SELECT COUNT(cl.id) FROM tr_candidate_list cl WHERE cl.requisition_id = jr.id) as total_applicants
      FROM tr_job_requisition jr
      LEFT JOIN mst_company comp ON jr.company = comp.id
      LEFT JOIN mst_department dep ON jr.department = dep.id
      LEFT JOIN mst_site site ON jr.site = site.id
      LEFT JOIN mst_level lvl ON jr.level = lvl.id
      LEFT JOIN mst_education edu ON jr.education = edu.id
      WHERE jr.id = ?
    `;

    // Query untuk mendapatkan statistik kandidat berdasarkan status
    const candidateStatsQuery = `
      SELECT 
        sc.id as status_id,
        sc.status as status_name,
        COUNT(cl.id) as count
      FROM mst_status_candidate sc
      LEFT JOIN tr_candidate_list cl ON sc.id = cl.status_candidate AND cl.requisition_id = ?
      GROUP BY sc.id, sc.status
      ORDER BY sc.seq
    `;

    // Query untuk mendapatkan log aktifitas lowongan
    const jobLogQuery = `
      SELECT 
        id,
        requisition_id,
        position_name,
        action,
        reason,
        status,
        created_at,
        created_by
      FROM tr_job_log
      WHERE requisition_id = ?
      ORDER BY created_at DESC
    `;

    // Eksekusi semua query
    const jobDetail = await db.$queryRawUnsafe(jobDetailQuery, jobId);
    const candidateStats = await db.$queryRawUnsafe(candidateStatsQuery, jobId);
    const jobLog = await db.$queryRawUnsafe(jobLogQuery, jobId);

    // Convert BigInt to string
    const sanitizedJobDetail = convertBigIntToString(jobDetail);
    const sanitizedCandidateStats = convertBigIntToString(candidateStats);
    const sanitizedJobLog = convertBigIntToString(jobLog);

    // Jika lowongan tidak ditemukan
    if (!sanitizedJobDetail || sanitizedJobDetail.length === 0) {
      return res.status(404).json({ 
        message: "Job vacancy not found" 
      });
    }

    // Tambahkan view counter
    let views = parseInt(sanitizedJobDetail[0].views || '0');
    views += 1;

    await db.tr_job_requisition.update({
      where: { id: jobId },
      data: { views: String(views) }
    });

    return res.status(200).json({
      message: "Job vacancy details retrieved successfully",
      data: {
        jobDetail: sanitizedJobDetail[0],
        candidateStats: sanitizedCandidateStats,
        jobLog: sanitizedJobLog
      }
    });
  } catch (error) {
    console.error("Error fetching job vacancy details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Mengupdate lowongan
export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const jobId = Number(req.params.id);
  const updatedData = {...req.body};
  const userId = updatedData.updated_by || null;
  
  // Ekstrak update_reason dari request body tetapi jangan sertakan dalam data update
  // karena field ini tidak ada dalam skema database
  const update_reason = updatedData.update_reason;
  delete updatedData.update_reason;

  try {
    // Validasi apakah lowongan ada
    const existingJob = await db.tr_job_requisition.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return res.status(404).json({ 
        error: "Job vacancy not found" 
      });
    }

    // Format data date jika ada
    if (updatedData.placement_date) {
      updatedData.placement_date = new Date(updatedData.placement_date);
    }
    if (updatedData.publish_date) {
      updatedData.publish_date = new Date(updatedData.publish_date);
    }
    if (updatedData.expired_date) {
      updatedData.expired_date = new Date(updatedData.expired_date);
    }

    // Tambahkan updated_at
    updatedData.updated_at = new Date();

    // Convert string to number untuk field numeric
    if (updatedData.company) updatedData.company = parseInt(updatedData.company);
    if (updatedData.department) updatedData.department = parseInt(updatedData.department);
    if (updatedData.employee_number) updatedData.employee_number = parseInt(updatedData.employee_number);
    if (updatedData.site) updatedData.site = parseInt(updatedData.site);
    if (updatedData.level) updatedData.level = parseInt(updatedData.level);
    if (updatedData.budget) updatedData.budget = parseInt(updatedData.budget);
    if (updatedData.education) updatedData.education = parseInt(updatedData.education);
    if (updatedData.is_active !== undefined) updatedData.is_active = parseInt(updatedData.is_active);
    if (updatedData.pic_job) updatedData.pic_job = parseInt(updatedData.pic_job);

    // Update lowongan
    const updatedVacancy = await db.tr_job_requisition.update({
      where: { id: jobId },
      data: updatedData
    });

    // Log perubahan lowongan
    await db.tr_job_log.create({
      data: {
        requisition_id: jobId,
        position_name: updatedVacancy.position || "",
        action: "Update",
        reason: update_reason || "Update job vacancy",
        status: updatedVacancy.status_requisition || "Updated",
        created_at: new Date(),
        created_by: userId ? parseInt(userId) : null
      }
    });

    return res.status(200).json({
      message: "Job vacancy updated successfully",
      data: updatedVacancy
    });
  } catch (error) {
    console.error("Error updating job vacancy:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Menghapus lowongan (soft delete dengan mengubah is_active = 0)
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const jobId = Number(req.params.id);
  const { reason, user_id } = req.body;

  try {
    // Validasi apakah lowongan ada
    const existingJob = await db.tr_job_requisition.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return res.status(404).json({ 
        error: "Job vacancy not found" 
      });
    }

    // Soft delete dengan mengubah is_active = 0
    const deletedVacancy = await db.tr_job_requisition.update({
      where: { id: jobId },
      data: { 
        is_active: 0,
        updated_at: new Date()
      }
    });

    // Log penghapusan lowongan
    await db.tr_job_log.create({
      data: {
        requisition_id: jobId,
        position_name: existingJob.position || "",
        action: "Delete",
        reason: reason || "Job vacancy deleted",
        status: "Deleted",
        created_at: new Date(),
        created_by: user_id ? parseInt(user_id) : null
      }
    });

    return res.status(200).json({
      message: "Job vacancy deleted successfully",
      data: deletedVacancy
    });
  } catch (error) {
    console.error("Error deleting job vacancy:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};