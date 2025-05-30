import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get all authorizations with pagination, search, and filters
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
    const sortColumn = (req.query.sort as string) || "id";
    const sortDirection = req.query.direction === "desc" ? "desc" : "asc";
    
    // Build where condition based on search
    let whereClause: any = {};
    if (search) {
      whereClause = {
        OR: [
          { employee_code: { contains: search, mode: 'insensitive' } },
          { employee_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Count total authorizations for pagination
    const totalCount = await db.mst_authorization.count({
      where: whereClause
    });

    // Get authorizations with pagination
    const authorizations = await db.mst_authorization.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        [sortColumn]: sortDirection as any
      }
    });

    // Get related data for dropdowns
    const companies = await db.mst_company.findMany({
      select: { id: true, company: true }
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      message: "Authorizations retrieved successfully",
      data: authorizations,
      companies: companies,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error("Error fetching authorizations:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a new authorization
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      employee_name,
      employee_code,
      profile_pic,
      email,
      no_hp,
      site,
      company,
      department,
      role
    } = req.body;

    // Validate required fields
    if (!employee_name || !employee_code) {
      return res.status(400).json({ error: "Employee name and code are required" });
    }

    // Check if employee code already exists
    const existingAuthorization = await db.mst_authorization.findFirst({
      where: { employee_code }
    });

    if (existingAuthorization) {
      return res.status(409).json({ error: "Employee code already exists" });
    }

    // Create new authorization
    const newAuthorization = await db.mst_authorization.create({
      data: {
        employee_name,
        employee_code,
        profile_pic,
        email,
        no_hp,
        site,
        company: company ? parseInt(company) : null,
        department,
        role,
        created_at: new Date()
      }
    });

    return res.status(201).json({
      message: "Authorization created successfully",
      data: newAuthorization
    });
  } catch (error) {
    console.error("Error creating authorization:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};