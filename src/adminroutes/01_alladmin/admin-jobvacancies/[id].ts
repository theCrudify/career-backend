// import { Response, Request } from "express";
// import { db } from "../../../utils/db";

// const convertBigIntToString = (data: any) => {
//   return JSON.parse(
//     JSON.stringify(data, (key, value) =>
//       typeof value === "bigint" ? value.toString() : value
//     )
//   );
// };

// // Get candidates for a specific job vacancy
// export const get = async (req: Request, res: Response) => {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const jobId = Number(req.params.id);

//   try {
//     // Validate job exists
//     const job = await db.tr_job_requisition.findUnique({
//       where: { id: jobId }
//     });

//     if (!job) {
//       return res.status(404).json({ error: "Job vacancy not found" });
//     }

//     // Parse pagination and filter parameters
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const offset = (page - 1) * limit;
    
//     const status = req.query.status as string;
//     const search = req.query.search as string;
//     const education = req.query.education as string;
    
//     // Use a more reliable approach with Prisma's findMany instead of raw SQL
//     const whereCondition: any = {
//       requisition_id: jobId
//     };
    
//     if (status) {
//       whereCondition.status_candidate = parseInt(status);
//     }
    
//     if (education) {
//       whereCondition.candidate = {
//         education: parseInt(education)
//       };
//     }
    
//     // Build search condition
//     if (search) {
//       whereCondition.candidate = {
//         ...whereCondition.candidate,
//         OR: [
//           { full_name: { contains: search } },
//           { email: { contains: search } }
//         ]
//       };
//     }
    
//     // Get candidates count for pagination
//     const totalItems = await db.tr_candidate_list.count({
//       where: whereCondition
//     });
    
//     // Get candidates with pagination
//     const candidates = await db.tr_candidate_list.findMany({
//       where: whereCondition,
//       include: {
//         candidate: {
//           include: {
//             experiences: true
//           }
//         },
//         job_requisition: true
//       },
//       orderBy: {
//         created_at: 'desc'
//       },
//       skip: offset,
//       take: limit
//     });
    
//     // Format the data for response
//     const formattedCandidates = candidates.map((candidate: { candidate: any; id: any; created_at: any; status_candidate: any; }) => {
//       const cr = candidate.candidate;
//       return {
//         id: candidate.id,
//         candidate_id: cr.id,
//         full_name: cr.full_name,
//         email: cr.email,
//         phone_number: cr.phone_number,
//         file_foto: cr.file_foto,
//         apply_date: candidate.created_at,
//         status_candidate: candidate.status_candidate,
//         education: cr.education,
//         expected_salary: cr.expected_salary,
//         age: cr.birth_date ? Math.floor((new Date().getTime() - new Date(cr.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
//         experience_count: cr.experiences?.length || 0
//       };
//     });
    
//     // Get filter options
//     const statuses = await db.mst_status_candidate.findMany({
//       orderBy: { seq: 'asc' },
//       select: { id: true, status: true }
//     });
    
//     const educations = await db.mst_education.findMany({
//       where: { is_aktif: 1 },
//       select: { id: true, description: true }
//     });
    
//     const totalPages = Math.ceil(totalItems / limit);
    
//     return res.status(200).json({
//       message: "Candidates retrieved successfully",
//       jobInfo: {
//         id: job.id,
//         position: job.position,
//         department: job.department,
//         site: job.site,
//         level: job.level,
//         status: job.status,
//         expired_date: job.expired_date
//       },
//       data: formattedCandidates,
//       filters: {
//         statuses,
//         educations
//       },
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalItems: totalItems,
//         itemsPerPage: limit
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching candidates:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };
