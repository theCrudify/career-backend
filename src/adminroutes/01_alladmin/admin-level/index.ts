// src/routes/01_alladmin/admin-levels/index.ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get all job levels with pagination, search, and company filter
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
      whereClause.OR = [
        { level_code: { contains: search } },
        { level_description: { contains: search } }
      ];
    }
    
    if (company) {
      whereClause.company = company;
    }
    
    if (activeOnly) {
      whereClause.is_aktif = 1;
    }

    // Get job levels with pagination
    const levels: { company: number | null }[] = await db.mst_level.findMany({
      where: whereClause,
      orderBy: [
        { company: 'asc' },
        { level_code: 'asc' }
      ],
      skip: offset,
      take: limit
    });

    // Count total levels for pagination
    const totalLevels = await db.mst_level.count({
      where: whereClause
    });

    const totalPages = Math.ceil(totalLevels / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Get company data for each level
    const enhancedLevels = await Promise.all(levels.map(async (level: { company: number | null }) => {
      let companyData = null;
      if (level.company) {
        companyData = await db.mst_company.findUnique({
          where: { id: level.company }
        });
      }
      return {
        ...level,
        company_data: companyData
      };
    }));

    // Get all companies for dropdown selection
    const companies = await db.mst_company.findMany({
      select: { id: true, company: true }
    });

    return res.status(200).json({
      message: "Job levels retrieved successfully",
      data: enhancedLevels,
      companies: companies, // For dropdown in UI
      pagination: {
        totalCount: totalLevels,
        totalPages: totalPages,
        currentPage: page,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      }
    });
  } catch (error) {
    console.error("Error fetching job levels:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a new job level
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      company,
      level_code,
      level_description,
      is_aktif = 1,
      update_by
    } = req.body;

    // Validate required fields
    if (!level_code) {
      return res.status(400).json({ error: "Level code is required" });
    }

    if (!level_description) {
      return res.status(400).json({ error: "Level description is required" });
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

    // Check if level already exists in the same company
    const existingLevel = await db.mst_level.findFirst({
      where: { 
        level_code,
        company: company ? parseInt(company) : null
      }
    });

    if (existingLevel) {
      return res.status(409).json({ error: "Level code already exists in this company" });
    }

    // Create job level
    const newLevel = await db.mst_level.create({
      data: {
        company: company ? parseInt(company) : null,
        level_code,
        level_description,
        is_aktif: is_aktif ? parseInt(is_aktif) : 1,
        last_update: new Date(),
        update_by: update_by || null
      }
    });

    return res.status(201).json({
      message: "Job level created successfully",
      data: newLevel
    });
  } catch (error) {
    console.error("Error creating job level:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};