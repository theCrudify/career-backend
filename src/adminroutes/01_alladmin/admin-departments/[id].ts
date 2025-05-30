// src/routes/01_alladmin/admin-departments/[id].ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get department by ID
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const departmentId = Number(req.params.id);

  try {
    const department = await db.mst_department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Get associated company if exists
    let companyData = null;
    if (department.company) {
      companyData = await db.mst_company.findUnique({
        where: { id: department.company }
      });
    }

    // Get job requisitions associated with this department
    const jobRequisitions = await db.tr_job_requisition.findMany({
      where: { department: departmentId },
      select: {
        id: true,
        position: true,
        status: true,
        is_active: true
      }
    });

    return res.status(200).json({
      message: "Department retrieved successfully",
      data: {
        ...department,
        company_data: companyData,
        job_requisitions: jobRequisitions
      }
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update department
export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const departmentId = Number(req.params.id);
  const {
    company,
    department,
    is_aktif,
    update_by
  } = req.body;

  try {
    // Check if department exists
    const existingDepartment = await db.mst_department.findUnique({
      where: { id: departmentId }
    });

    if (!existingDepartment) {
      return res.status(404).json({ error: "Department not found" });
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

    // Check if the updated department name would conflict with existing one
    if (department && department !== existingDepartment.department) {
      const duplicateDepartment = await db.mst_department.findFirst({
        where: { 
          department,
          company: company ? parseInt(company) : existingDepartment.company,
          id: { not: departmentId }
        }
      });

      if (duplicateDepartment) {
        return res.status(409).json({ error: "Department already exists in this company" });
      }
    }

    // Update department
    const updatedDepartment = await db.mst_department.update({
      where: { id: departmentId },
      data: {
        company: company ? parseInt(company) : existingDepartment.company,
        department: department || existingDepartment.department,
        is_aktif: is_aktif !== undefined ? parseInt(is_aktif) : existingDepartment.is_aktif,
        last_update: new Date(),
        update_by: update_by || existingDepartment.update_by
      }
    });

    return res.status(200).json({
      message: "Department updated successfully",
      data: updatedDepartment
    });
  } catch (error) {
    console.error("Error updating department:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete department
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const departmentId = Number(req.params.id);

  try {
    // Check if department exists
    const existingDepartment = await db.mst_department.findUnique({
      where: { id: departmentId }
    });

    if (!existingDepartment) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Check for related job requisitions (to maintain referential integrity)
    const relatedJobs = await db.tr_job_requisition.count({
      where: { department: departmentId }
    });

    if (relatedJobs > 0) {
      return res.status(409).json({ 
        error: "Cannot delete department with related job requisitions",
        related_jobs: relatedJobs
      });
    }

    // Delete department
    await db.mst_department.delete({
      where: { id: departmentId }
    });

    return res.status(200).json({
      message: "Department deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Alternative to deletion: deactivate department
export const deactivate = async (req: Request, res: Response) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const departmentId = Number(req.params.id);
  const { update_by } = req.body;

  try {
    // Check if department exists
    const existingDepartment = await db.mst_department.findUnique({
      where: { id: departmentId }
    });

    if (!existingDepartment) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Set is_aktif to 0 (inactive)
    const deactivatedDepartment = await db.mst_department.update({
      where: { id: departmentId },
      data: {
        is_aktif: 0,
        last_update: new Date(),
        update_by: update_by || existingDepartment.update_by
      }
    });

    return res.status(200).json({
      message: "Department deactivated successfully",
      data: deactivatedDepartment
    });
  } catch (error) {
    console.error("Error deactivating department:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};