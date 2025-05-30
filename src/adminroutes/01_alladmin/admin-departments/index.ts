// src/routes/01_alladmin/admin-departments/index.ts
import { Request, Response } from "express";
import { db } from "../../../utils/db";

// Get all departments with pagination, search, and company filter
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string)?.toLowerCase() || "";
    const sortColumn = (req.query.sort as string) || "id";
    const sortDirection = req.query.direction === "desc" ? "desc" : "asc";
    const activeOnly = req.query.active === "true";

    // Build where condition
    let whereClause: any = {};

    if (search) {
      whereClause = {
        department: {
          contains: search,
          insensitive: true
        }
      };
    }
    
    
    if (activeOnly) {
      whereClause.is_aktif = 1;
    }
    
    

    // Fetch departments and count
    const [departments, totalCount] = await db.$transaction([
      db.mst_department.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          [sortColumn]: sortDirection
        }
      }),
      db.mst_department.count({ where: whereClause })
    ]);
    
    
    
    // Fetch companies
    const companies = await db.mst_company.findMany({
      select: { id: true, company: true, company_code: true, location: true }
    });
    const companyMap = new Map<number, { company: string; company_code: string; location: string }>(
      companies.map((c: { id: number; company: string; company_code: string; location: string }) => [c.id, { company: c.company, company_code: c.company_code, location: c.location }])
    );

    // Enhance departments with company info
    let enhancedDepartments = departments.map((dept: { company: unknown; id: any; department: any; is_aktif: any; last_update: any; update_by: any; }) => {
      const companyData = typeof dept.company === "number" ? companyMap.get(dept.company) : null;
      return {
        id: dept.id,
        department: dept.department,
        is_aktif: dept.is_aktif,
        last_update: dept.last_update,
        update_by: dept.update_by,
        company: companyData?.company || null,
        company_code: companyData?.company_code || null,
        location: companyData?.location || null
      };
    });

    // Manual in-memory search for company-related fields
    if (search) {
      enhancedDepartments = enhancedDepartments.filter((dept: { department: any; company: any; company_code: any; location: any; }) =>
        [dept.department, dept.company, dept.company_code, dept.location]
          .some(field => field?.toLowerCase().includes(search))
      );
    }

    // Manual sort for virtual fields
    if (["company", "company_code", "location"].includes(sortColumn)) {
      enhancedDepartments.sort((a: { [x: string]: any; }, b: { [x: string]: any; }) => {
        const aValue = (a[sortColumn] || "").toLowerCase();
        const bValue = (b[sortColumn] || "").toLowerCase();
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    // Manual pagination after filter/sort
    const paginatedData = enhancedDepartments.slice(0, limit);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      message: "Departments retrieved successfully",
      data: paginatedData,
      companies: companies.map((c: { id: any; company: any; }) => ({ id: c.id, company: c.company })),
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};




// Create a new department
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      company,
      department,
      is_aktif = 1,
      update_by
    } = req.body;

    // Validate required fields
    if (!department) {
      return res.status(400).json({ error: "Department name is required" });
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

    // Check if department already exists in the same company
    const existingDepartment = await db.mst_department.findFirst({
      where: { 
        department,
        company: company ? parseInt(company) : null
      }
    });

    if (existingDepartment) {
      return res.status(409).json({ error: "Department already exists in this company" });
    }

    // Create department
    const newDepartment = await db.mst_department.create({
      data: {
        company: company ? parseInt(company) : null,
        department,
        is_aktif: is_aktif ? parseInt(is_aktif) : 1,
        last_update: new Date(),
        update_by: update_by || null
      }
    });

    return res.status(201).json({
      message: "Department created successfully",
      data: newDepartment
    });
  } catch (error) {
    console.error("Error creating department:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};