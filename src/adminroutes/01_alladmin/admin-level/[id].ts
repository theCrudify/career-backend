// src/routes/01_alladmin/admin-levels/[id].ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get job level by ID
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const levelId = Number(req.params.id);

  try {
    const level = await db.mst_level.findUnique({
      where: { id: levelId }
    });

    if (!level) {
      return res.status(404).json({ error: "Job level not found" });
    }

    // Get associated company if exists
    let companyData = null;
    if (level.company) {
      companyData = await db.mst_company.findUnique({
        where: { id: level.company }
      });
    }

    // Get job requisitions associated with this level
    const jobRequisitions = await db.tr_job_requisition.findMany({
      where: { level: levelId },
      select: {
        id: true,
        position: true,
        status: true,
        is_active: true
      }
    });

    return res.status(200).json({
      message: "Job level retrieved successfully",
      data: {
        ...level,
        company_data: companyData,
        job_requisitions: jobRequisitions
      }
    });
  } catch (error) {
    console.error("Error fetching job level:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update job level
export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const levelId = Number(req.params.id);
  const {
    company,
    level_code,
    level_description,
    is_aktif,
    update_by
  } = req.body;

  try {
    // Check if job level exists
    const existingLevel = await db.mst_level.findUnique({
      where: { id: levelId }
    });

    if (!existingLevel) {
      return res.status(404).json({ error: "Job level not found" });
    }

    // Validate company if provided
    if (company) {
      const companyExists = await db.mst_company.findUnique({
        where: { id: parseInt(company) }
      });

      if (!companyExists) {
        return res.status(400).json({ error: "Selected company does not exist" });
      }
    }

    // Check if the updated level code would conflict with existing one
    if (level_code && level_code !== existingLevel.level_code) {
      const duplicateLevel = await db.mst_level.findFirst({
        where: { 
          level_code,
          company: company ? parseInt(company) : existingLevel.company,
          id: { not: levelId }
        }
      });

      if (duplicateLevel) {
        return res.status(409).json({ error: "Level code already exists in this company" });
      }
    }

    // Update job level
    const updatedLevel = await db.mst_level.update({
      where: { id: levelId },
      data: {
        company: company ? parseInt(company) : existingLevel.company,
        level_code: level_code || existingLevel.level_code,
        level_description: level_description || existingLevel.level_description,
        is_aktif: is_aktif !== undefined ? parseInt(is_aktif) : existingLevel.is_aktif,
        last_update: new Date(),
        update_by: update_by || existingLevel.update_by
      }
    });

    return res.status(200).json({
      message: "Job level updated successfully",
      data: updatedLevel
    });
  } catch (error) {
    console.error("Error updating job level:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete job level
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const levelId = Number(req.params.id);

  try {
    // Check if job level exists
    const existingLevel = await db.mst_level.findUnique({
      where: { id: levelId }
    });

    if (!existingLevel) {
      return res.status(404).json({ error: "Job level not found" });
    }

    // Check for related job requisitions (to maintain referential integrity)
    const relatedJobs = await db.tr_job_requisition.count({
      where: { level: levelId }
    });

    if (relatedJobs > 0) {
      return res.status(409).json({ 
        error: "Cannot delete job level with related job requisitions",
        related_jobs: relatedJobs
      });
    }

    // Delete job level
    await db.mst_level.delete({
      where: { id: levelId }
    });

    return res.status(200).json({
      message: "Job level deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting job level:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Alternative to deletion: deactivate job level
export const deactivate = async (req: Request, res: Response) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const levelId = Number(req.params.id);
  const { update_by } = req.body;

  try {
    // Check if job level exists
    const existingLevel = await db.mst_level.findUnique({
      where: { id: levelId }
    });

    if (!existingLevel) {
      return res.status(404).json({ error: "Job level not found" });
    }

    // Set is_aktif to 0 (inactive)
    const deactivatedLevel = await db.mst_level.update({
      where: { id: levelId },
      data: {
        is_aktif: 0,
        last_update: new Date(),
        update_by: update_by || existingLevel.update_by
      }
    });

    return res.status(200).json({
      message: "Job level deactivated successfully",
      data: deactivatedLevel
    });
  } catch (error) {
    console.error("Error deactivating job level:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};