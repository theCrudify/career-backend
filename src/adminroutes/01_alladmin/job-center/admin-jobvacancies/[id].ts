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
 * Mendapatkan daftar kandidat untuk lowongan pekerjaan tertentu
 */
export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const id = parseInt(req.params.id, 10);

    try {
        const data = await db.$queryRaw`
        select 
        a.id,
        a.company,
        a.position,            
        a.department,
        a.site,
        a.level,
        a.status,
        a.education,
        a.hiring_type,
        a.specific_skill,
        a.description,
        a.min_experience,
        a.gender,
        a.age,
        a.marital_status,
        a.employee_number,
        a.budget,
        a.expired_date,
        a.is_active
        FROM 
            tr_job_requisition a
        where a.id = ${id}
        `;

        return res.status(200).json({ data });
    } catch (error) {
        console.error("ini error", error)
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
/**
 * Memperbarui lowongan pekerjaan
 */
export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const jobId = Number(req.params.id);
  const updatedData = {...req.body};
  const userId = updatedData.updated_by || null;
  
  // Ekstrak update_reason dari request body tetapi jangan sertakan dalam data update
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

/**
 * Menghapus lowongan pekerjaan (soft delete dengan mengubah is_active = 0)
 */
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

/**
 * Menerbitkan lowongan (publish)
 */
export const publish = async (req: Request, res: Response) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const jobId = Number(req.params.id);
  const { user_id } = req.body;

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

    // Update status lowongan jadi "Published"
    const updatedVacancy = await db.tr_job_requisition.update({
      where: { id: jobId },
      data: { 
        is_active: 1,
        status_requisition: "Published",
        publish_date: new Date(),
        updated_at: new Date()
      }
    });

    // Log publikasi lowongan
    await db.tr_job_log.create({
      data: {
        requisition_id: jobId,
        position_name: existingJob.position || "",
        action: "Publish",
        reason: "Job vacancy published",
        status: "Published",
        created_at: new Date(),
        created_by: user_id ? parseInt(user_id) : null
      }
    });

    return res.status(200).json({
      message: "Job vacancy published successfully",
      data: updatedVacancy
    });
  } catch (error) {
    console.error("Error publishing job vacancy:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Menonaktifkan atau mengakhiri lowongan (unpublish)
 */
export const unpublish = async (req: Request, res: Response) => {
  if (req.method !== "PATCH") {
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

    // Update status lowongan jadi "Unpublished"
    const updatedVacancy = await db.tr_job_requisition.update({
      where: { id: jobId },
      data: { 
        is_active: 0,
        status_requisition: "Unpublished",
        updated_at: new Date()
      }
    });

    // Log penonaktifan lowongan
    await db.tr_job_log.create({
      data: {
        requisition_id: jobId,
        position_name: existingJob.position || "",
        action: "Unpublish",
        reason: reason || "Job vacancy unpublished",
        status: "Unpublished",
        created_at: new Date(),
        created_by: user_id ? parseInt(user_id) : null
      }
    });

    return res.status(200).json({
      message: "Job vacancy unpublished successfully",
      data: updatedVacancy
    });
  } catch (error) {
    console.error("Error unpublishing job vacancy:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};