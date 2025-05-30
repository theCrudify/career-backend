// src/routes/01_alladmin/admin-sites/index.ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get all sites with pagination, search, and company filter
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse pagination and filter parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const company = req.query.company ? parseInt(req.query.company as string) : undefined;
    const activeOnly = req.query.active === 'true';

    // Build where clause based on filters
    let whereClause: any = {};
    
    if (search) {
      whereClause.site_description = { contains: search };
    }
    
    if (company) {
      whereClause.company = company;
    }
    
    if (activeOnly) {
      whereClause.is_aktif = 1;
    }

    // Get sites with pagination
    const sites = await db.mst_site.findMany({
      where: whereClause,
      orderBy: { site_description: 'asc' },
      skip: offset,
      take: limit
    });

    // Count total sites for pagination
    const totalSites = await db.mst_site.count({
      where: whereClause
    });

    // Get company data for each site
    const enhancedSites = await Promise.all(sites.map(async (site: { company: any; }) => {
      let companyData = null;
      if (site.company) {
        companyData = await db.mst_company.findUnique({
          where: { id: site.company }
        });
      }
      return {
        ...site,
        company_data: companyData
      };
    }));

    // Get all companies for dropdown selection
    const companies = await db.mst_company.findMany({
      select: { id: true, company: true }
    });

    return res.status(200).json({
      message: "Sites retrieved successfully",
      data: enhancedSites,
      companies: companies, // For dropdown in UI
      pagination: {
        total: totalSites,
        page,
        limit,
        pages: Math.ceil(totalSites / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a new site
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      company,
      site_description,
      is_aktif = 1,
      update_by
    } = req.body;

    // Validate required fields
    if (!site_description) {
      return res.status(400).json({ error: "Site description is required" });
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

    // Check if site already exists in the same company
    const existingSite = await db.mst_site.findFirst({
      where: { 
        site_description,
        company: company ? parseInt(company) : null
      }
    });

    if (existingSite) {
      return res.status(409).json({ error: "Site already exists in this company" });
    }

    // Create site
    const newSite = await db.mst_site.create({
      data: {
        company: company ? parseInt(company) : null,
        site_description,
        is_aktif: is_aktif ? parseInt(is_aktif) : 1,
        last_update: new Date(),
        update_by: update_by || null
      }
    });

    return res.status(201).json({
      message: "Site created successfully",
      data: newSite
    });
  } catch (error) {
    console.error("Error creating site:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};