// src/routes/01_alladmin/admin-companies/index.ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get all companies with pagination and search
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    // Build query based on search
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { company: { contains: search } },
          { company_code: { contains: search } },
          { business_line: { contains: search } }
        ]
      };
    }

    // Get companies with pagination
    const companies = await db.mst_company.findMany({
      where: whereClause,
      orderBy: { id: 'asc' },
      skip: offset,
      take: limit
    });

    // Count total companies
    const totalCount = await db.mst_company.count({
      where: whereClause
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      message: "Companies retrieved successfully",
      data: companies,
      pagination: {
        totalCount: totalCount,
        totalPages: totalPages,
        currentPage: page,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Create a new company
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      company,
      company_code,
      total_employee,
      location,
      description,
      total_vacancy,
      business_line
    } = req.body;

    // Validate required fields
    if (!company) {
      return res.status(400).json({ error: "Company name is required" });
    }

    if (!company_code) {
      return res.status(400).json({ error: "Company code is required" });
    }

    // Check if company with the same code already exists
    const existingCompany = await db.mst_company.findFirst({
      where: { company_code }
    });

    if (existingCompany) {
      return res.status(409).json({ error: "Company with this code already exists" });
    }

    // Create company
    const newCompany = await db.mst_company.create({
      data: {
        company,
        company_code,
        total_employee: total_employee ? parseInt(total_employee) : null,
        location,
        description,
        total_vacancy: total_vacancy ? parseInt(total_vacancy) : null,
        business_line
      }
    });

    return res.status(201).json({
      message: "Company created successfully",
      data: newCompany
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


