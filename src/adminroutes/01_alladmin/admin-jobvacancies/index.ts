// // File: src/routes/admin/job-vacancies/index.ts
// import { Response, Request } from "express";
// import { db } from "../../../utils/db";

// const convertBigIntToString = (data: any) => {
//   return JSON.parse(
//     JSON.stringify(data, (key, value) =>
//       typeof value === "bigint" ? value.toString() : value
//     )
//   );
// };

// // Get all job vacancies with candidate counts
// export const get = async (req: Request, res: Response) => {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     // Parse pagination parameters
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const offset = (page - 1) * limit;
    
//     // Get search and filter parameters
//     const search = req.query.search as string;
//     const department = req.query.department as string;
//     const status = req.query.status as string;
//     const isActive = req.query.is_active !== undefined ? 
//       parseInt(req.query.is_active as string) : 1; // Default to active jobs
    
//     // Build query conditions
//     let whereClause = `WHERE jr.is_active = ${isActive} `;
//     const params: any[] = [];
    
//     if (search) {
//       whereClause += ` AND jr.position LIKE ? `;
//       params.push(`%${search}%`);
//     }
    
//     if (department) {
//       whereClause += ` AND jr.department = ? `;
//       params.push(parseInt(department));
//     }
    
//     if (status) {
//       whereClause += ` AND jr.status = ? `;
//       params.push(status);
//     }
    
//     // Main query to get jobs with candidate counts
//     const query = `
//       SELECT 
//         jr.id,
//         jr.position,
//         jr.status,
//         jr.department,
//         dep.department AS department_name,
//         jr.site,
//         site.site_description AS site_name,
//         jr.level,
//         lvl.level_description AS level_name,
//         jr.publish_date,
//         jr.expired_date,
//         jr.description,
//         jr.is_active,
//         (
//           SELECT COUNT(*) 
//           FROM tr_candidate_list cl
//           WHERE cl.requisition_id = jr.id
//         ) AS candidate_count,
//         (
//           SELECT COUNT(*) 
//           FROM tr_candidate_list cl
//           WHERE cl.requisition_id = jr.id 
//           AND cl.status_candidate = 1
//         ) AS new_candidate_count
//       FROM tr_job_requisition jr
//       LEFT JOIN mst_department dep ON jr.department = dep.id
//       LEFT JOIN mst_site site ON jr.site = site.id
//       LEFT JOIN mst_level lvl ON jr.level = lvl.id
//       ${whereClause}
//       ORDER BY jr.created_at DESC
//       LIMIT ?, ?
//     `;
    
//     // Count query for pagination
//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM tr_job_requisition jr
//       ${whereClause}
//     `;
    
//     // Execute queries
//     const jobs = await db.$queryRawUnsafe(query, ...params, offset, limit);
//     const countResult = await db.$queryRawUnsafe(countQuery, ...params);
    
//     // Convert BigInt to string
//     const sanitizedJobs = convertBigIntToString(jobs);
//     const totalItems = parseInt((countResult as any)[0].total.toString());
//     const totalPages = Math.ceil(totalItems / limit);
    
//     // Get filter options
//     const departments = await db.mst_department.findMany({
//       where: { is_aktif: 1 },
//       select: { id: true, department: true }
//     });
    
//     return res.status(200).json({
//       message: "Job vacancies retrieved successfully",
//       data: sanitizedJobs,
//       filters: {
//         departments
//       },
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalItems: totalItems,
//         itemsPerPage: limit
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching job vacancies:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };
