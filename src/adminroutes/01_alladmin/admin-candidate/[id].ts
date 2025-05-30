// // File: src/routes/admin/candidates/[id].ts
// import { Response, Request } from "express";
// import { db } from "../../../utils/db";

// // Get detailed information about a candidate application
// export const get = async (req: Request, res: Response) => {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const candidateListId = Number(req.params.id);

//   try {
//     // Get candidate application data with related information
//     const candidateQuery = `
//       SELECT 
//         cl.id as candidate_list_id,
//         cl.requisition_id as job_id,
//         cl.candidate_id,
//         cl.status_candidate,
//         cl.created_at as apply_date,
//         cl.updated_at as last_updated,
        
//         jr.position as job_position,
//         jr.department as dept_id,
//         d.department as department_name,
//         jr.site as site_id,
//         s.site_description as site_name,
//         jr.level as level_id,
//         l.level_description as level_name,
        
//         cr.full_name,
//         cr.email,
//         cr.phone_number,
//         cr.birth_date,
//         TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) as age,
//         cr.gender,
//         cr.marital_status,
//         cr.religion,
//         cr.domicile_address,
//         cr.education as education_id,
//         e.description as education_name,
//         cr.institution,
//         cr.major,
//         cr.year_of_graduation,
//         cr.score,
//         cr.expected_salary,
//         cr.file_foto,
//         cr.cv
//       FROM tr_candidate_list cl
//       JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
//       JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
//       LEFT JOIN mst_department d ON jr.department = d.id
//       LEFT JOIN mst_site s ON jr.site = s.id
//       LEFT JOIN mst_level l ON jr.level = l.id
//       LEFT JOIN mst_education e ON cr.education = e.id
//       WHERE cl.id = ?
//     `;
    
//     // Get experience data
//     const experienceQuery = `
//       SELECT *
//       FROM tr_experience_candidate
//       WHERE id_candidate = (
//         SELECT candidate_id FROM tr_candidate_list WHERE id = ?
//       )
//       ORDER BY experience_start_date DESC
//     `;
    
//     // Get skills data
//     const skillsQuery = `
//       SELECT *
//       FROM tr_skill_candidate
//       WHERE id_candidate = (
//         SELECT candidate_id FROM tr_candidate_list WHERE id = ?
//       )
//     `;
    
//     // Get status history
//     const historyQuery = `
//       SELECT *
//       FROM tr_candidate_log
//       WHERE candidate_list_id = ?
//       ORDER BY created_at DESC
//     `;
    
//     // Get interview schedule
//     const interviewQuery = `
//       SELECT *
//       FROM tr_interview
//       WHERE candidate_list_id = ?
//       ORDER BY plan_date DESC
//     `;
    
//     // Execute all queries
//     const [candidateData, experiences, skills, statusHistory, interviews] = await Promise.all([
//       db.$queryRaw`SELECT 
//         cl.id as candidate_list_id,
//         cl.requisition_id as job_id,
//         cl.candidate_id,
//         cl.status_candidate,
//         cl.created_at as apply_date,
//         cl.updated_at as last_updated,
        
//         jr.position as job_position,
//         jr.department as dept_id,
//         d.department as department_name,
//         jr.site as site_id,
//         s.site_description as site_name,
//         jr.level as level_id,
//         l.level_description as level_name,
        
//         cr.full_name,
//         cr.email,
//         cr.phone_number,
//         cr.birth_date,
//         TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) as age,
//         cr.gender,
//         cr.marital_status,
//         cr.religion,
//         cr.domicile_address,
//         cr.education as education_id,
//         e.description as education_name,
//         cr.institution,
//         cr.major,
//         cr.year_of_graduation,
//         cr.score,
//         cr.expected_salary,
//         cr.file_foto,
//         cr.cv
//       FROM tr_candidate_list cl
//       JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
//       JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
//       LEFT JOIN mst_department d ON jr.department = d.id
//       LEFT JOIN mst_site s ON jr.site = s.id
//       LEFT JOIN mst_level l ON jr.level = l.id
//       LEFT JOIN mst_education e ON cr.education = e.id
//       WHERE cl.id = ${candidateListId}`,
//       db.$queryRaw`SELECT *
//       FROM tr_experience_candidate
//       WHERE id_candidate = (
//         SELECT candidate_id FROM tr_candidate_list WHERE id = ${candidateListId}
//       )
//       ORDER BY experience_start_date DESC`,
//       db.$queryRaw`
//       SELECT *
//       FROM tr_skill_candidate
//       WHERE id_candidate = (
//         SELECT candidate_id FROM tr_candidate_list WHERE id = ${candidateListId}
//       )
//       `,
//       db.$queryRaw`SELECT * FROM tr_candidate_log WHERE candidate_list_id = ${candidateListId} ORDER BY created_at DESC`,
//       db.$queryRaw`
//       SELECT *
//       FROM tr_interview
//       WHERE candidate_list_id = ${candidateListId}
//       ORDER BY plan_date DESC
//       `
//     ]);
    
//     // Convert BigInt to string in all results
//     const sanitizedData = {
//       candidateData: convertBigIntToString(candidateData),
//       experiences: convertBigIntToString(experiences),
//       skills: convertBigIntToString(skills),
//       statusHistory: convertBigIntToString(statusHistory),
//       interviews: convertBigIntToString(interviews)
//     };
    
//     // Check if data exists
//     if (!sanitizedData.candidateData || sanitizedData.candidateData.length === 0) {
//       return res.status(404).json({ error: "Candidate application not found" });
//     }
    
//     return res.status(200).json({
//       message: "Candidate details retrieved successfully",
//       data: sanitizedData
//     });
//   } catch (error) {
//     console.error("Error fetching candidate details:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// // Update candidate status
// export const updateStatus = async (req: Request, res: Response) => {
//   if (req.method !== "PUT") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const candidateListId = Number(req.params.id);
//   const { status, notes, updated_by } = req.body;

//   try {
//     // Validate required fields
//     if (!status) {
//       return res.status(400).json({ error: "Status is required" });
//     }

//     // Verify candidate exists
//     const candidate = await db.tr_candidate_list.findUnique({
//       where: { id: candidateListId },
//       include: {
//         // tr_candidate_reg: true, // Removed as it is not a valid property
//         job_requisition: true
//       }
//     });

//     if (!candidate) {
//       return res.status(404).json({ error: "Candidate application not found" });
//     }

//     // Update status
//     const updatedCandidate = await db.tr_candidate_list.update({
//       where: { id: candidateListId },
//       data: {
//         status_candidate: parseInt(status),
//         updated_at: new Date()
//       }
//     });

//     // Log the status change
//     await db.tr_candidate_log.create({
//       data: {
//         candidate_list_id: candidateListId,
//         action: `Status updated to ${status}`,
//         result: notes || "",
//         status_candidate: status.toString(),
//         created_at: new Date(),
//         created_by: updated_by ? parseInt(updated_by) : null
//       }
//     });

//     // Send email notification if needed
//     // This would call your existing email notification function

//     return res.status(200).json({
//       message: "Candidate status updated successfully",
//       data: updatedCandidate
//     });
//   } catch (error) {
//     console.error("Error updating candidate status:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };


// const convertBigIntToString = (data: any) => {
//     return JSON.parse(
//       JSON.stringify(data, (key, value) =>
//         typeof value === "bigint" ? value.toString() : value
//       )
//     );
//   };