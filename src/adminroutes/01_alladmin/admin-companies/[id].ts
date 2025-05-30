// src/routes/01_alladmin/admin-companies/[id].ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get company by ID
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const companyId = Number(req.params.id);

  try {
    const company = await db.mst_company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Get related departments and sites for this company
    const relatedDepartments = await db.mst_department.findMany({
      where: { company: companyId, is_aktif: 1 }
    });

    const relatedSites = await db.mst_site.findMany({
      where: { company: companyId, is_aktif: 1 }
    });

    return res.status(200).json({
      message: "Company retrieved successfully",
      data: {
        ...company,
        departments: relatedDepartments,
        sites: relatedSites
      }
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update company
export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const companyId = Number(req.params.id);
  const {
    company,
    company_code,
    total_employee,
    location,
    description,
    total_vacancy,
    business_line
  } = req.body;

  try {
    // Check if company exists
    const existingCompany = await db.mst_company.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check if company code is being changed and already exists
    if (company_code && company_code !== existingCompany.company_code) {
      const duplicateCode = await db.mst_company.findFirst({
        where: { 
          company_code,
          id: { not: companyId }
        }
      });

      if (duplicateCode) {
        return res.status(409).json({ error: "Company with this code already exists" });
      }
    }

    // Update company
    const updatedCompany = await db.mst_company.update({
      where: { id: companyId },
      data: {
        company: company || existingCompany.company,
        company_code: company_code || existingCompany.company_code,
        total_employee: total_employee ? parseInt(total_employee) : existingCompany.total_employee,
        location: location !== undefined ? location : existingCompany.location,
        description: description !== undefined ? description : existingCompany.description,
        total_vacancy: total_vacancy ? parseInt(total_vacancy) : existingCompany.total_vacancy,
        business_line: business_line !== undefined ? business_line : existingCompany.business_line
      }
    });

    return res.status(200).json({
      message: "Company updated successfully",
      data: updatedCompany
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete company
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const companyId = Number(req.params.id);

  try {
    // Check if company exists
    const existingCompany = await db.mst_company.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check for related departments or sites (to maintain referential integrity)
    const relatedDepartments = await db.mst_department.count({
      where: { company: companyId }
    });

    const relatedSites = await db.mst_site.count({
      where: { company: companyId }
    });

    if (relatedDepartments > 0 || relatedSites > 0) {
      return res.status(409).json({ 
        error: "Cannot delete company with related departments or sites",
        related: {
          departments: relatedDepartments,
          sites: relatedSites
        }
      });
    }

    // Delete company
    await db.mst_company.delete({
      where: { id: companyId }
    });

    return res.status(200).json({
      message: "Company deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};