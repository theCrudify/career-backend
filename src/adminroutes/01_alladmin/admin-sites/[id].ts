// src/routes/01_alladmin/admin-sites/[id].ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get site by ID
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const siteId = Number(req.params.id);

  try {
    const site = await db.mst_site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }

    // Get associated company if exists
    let companyData = null;
    if (site.company) {
      companyData = await db.mst_company.findUnique({
        where: { id: site.company }
      });
    }

    // Get job requisitions associated with this site
    const jobRequisitions = await db.tr_job_requisition.findMany({
      where: { site: siteId },
      select: {
        id: true,
        position: true,
        status: true,
        is_active: true
      }
    });

    return res.status(200).json({
      message: "Site retrieved successfully",
      data: {
        ...site,
        company_data: companyData,
        job_requisitions: jobRequisitions
      }
    });
  } catch (error) {
    console.error("Error fetching site:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update site
export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const siteId = Number(req.params.id);
  const {
    company,
    site_description,
    is_aktif,
    update_by
  } = req.body;

  try {
    // Check if site exists
    const existingSite = await db.mst_site.findUnique({
      where: { id: siteId }
    });

    if (!existingSite) {
      return res.status(404).json({ error: "Site not found" });
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

    // Check if the updated site description would conflict with existing one
    if (site_description && site_description !== existingSite.site_description) {
      const duplicateSite = await db.mst_site.findFirst({
        where: { 
          site_description,
          company: company ? parseInt(company) : existingSite.company,
          id: { not: siteId }
        }
      });

      if (duplicateSite) {
        return res.status(409).json({ error: "Site already exists in this company" });
      }
    }

    // Update site
    const updatedSite = await db.mst_site.update({
      where: { id: siteId },
      data: {
        company: company ? parseInt(company) : existingSite.company,
        site_description: site_description || existingSite.site_description,
        is_aktif: is_aktif !== undefined ? parseInt(is_aktif) : existingSite.is_aktif,
        last_update: new Date(),
        update_by: update_by || existingSite.update_by
      }
    });

    return res.status(200).json({
      message: "Site updated successfully",
      data: updatedSite
    });
  } catch (error) {
    console.error("Error updating site:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete site
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const siteId = Number(req.params.id);

  try {
    // Check if site exists
    const existingSite = await db.mst_site.findUnique({
      where: { id: siteId }
    });

    if (!existingSite) {
      return res.status(404).json({ error: "Site not found" });
    }

    // Check for related job requisitions (to maintain referential integrity)
    const relatedJobs = await db.tr_job_requisition.count({
      where: { site: siteId }
    });

    if (relatedJobs > 0) {
      return res.status(409).json({ 
        error: "Cannot delete site with related job requisitions",
        related_jobs: relatedJobs
      });
    }

    // Delete site
    await db.mst_site.delete({
      where: { id: siteId }
    });

    return res.status(200).json({
      message: "Site deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting site:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
