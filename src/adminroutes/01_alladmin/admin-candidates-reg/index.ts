// // src/routes/candidates-null-status/index.ts
// import { Response, Request } from "express";
// import { db } from "../../../utils/db";

// const convertBigIntToString = (data: any) => {
//   return JSON.parse(
//     JSON.stringify(data, (key, value) =>
//       typeof value === "bigint" ? value.toString() : value
//     )
//   );
// };

// export const get = async (req: Request, res: Response) => {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     // Parse query parameters untuk pagination
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 50;
//     const offset = (page - 1) * limit;
    
//     // Parameter untuk mengontrol apakah query singkat atau lengkap
//     const simple = req.query.simple === 'true';
    
//     // Pilih query berdasarkan parameter 'simple'
//     let query;
    
//     if (simple) {
//       // Query singkat untuk performa lebih cepat
//       query = `
//         SELECT 
//           cl.id,
//           cl.requisition_id,
//           cl.candidate_id,
//           cl.status_candidate,
//           cl.created_at,
//           cr.full_name,
//           cr.email,
//           jr.position
//         FROM tr_candidate_list cl
//         JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
//         JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
//         WHERE cl.status_candidate IS NULL OR cl.status_candidate = ''
//         ORDER BY cl.created_at DESC
//         LIMIT ?, ?
//       `;
//     } else {
//       // Query lengkap dengan semua informasi yang dibutuhkan
//       query = `
//         SELECT 
//           -- Data dari tr_candidate_list
//           cl.id,
//           cl.requisition_id,
//           cl.candidate_id,
//           cl.status_candidate,
//           cl.is_fail,
//           cl.joined_date,
//           cl.created_at,
//           cl.updated_at,
//           cl.source,
//           cl.reviewer,
//           cl.pic_join,
//           cl.pic_phone,
//           cl.address_join,
//           cl.offering_letter,
//           cl.start_offering,
//           cl.end_offering,
//           cl.referral_nik,
//           cl.referral_name,
          
//           -- Data dari tr_candidate_reg
//           cr.full_name,
//           cr.email,
//           cr.phone_number,
//           cr.birth_date,
//           cr.gender,
//           cr.marital_status,
//           cr.religion,
//           cr.education,
//           edu.description as education_name,
//           cr.institution,
//           cr.major,
//           cr.year_of_graduation,
//           cr.score,
//           cr.expected_salary,
//           cr.is_fresh_graduate,
//           cr.file_foto,
//           cr.cv,
          
//           -- Data dari tr_job_requisition
//           jr.position,
//           jr.site,
//           site.site_description as site_name,
//           jr.department,
//           dep.department as department_name,
//           jr.level,
//           lvl.level_description as level_name,
//           jr.status as job_status
//         FROM tr_candidate_list cl
//         JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
//         JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
//         LEFT JOIN mst_department dep ON jr.department = dep.id
//         LEFT JOIN mst_site site ON jr.site = site.id
//         LEFT JOIN mst_level lvl ON jr.level = lvl.id
//         LEFT JOIN mst_education edu ON cr.education = edu.id
//         WHERE cl.status_candidate IS NULL OR cl.status_candidate = ''
//         ORDER BY cl.created_at DESC
//         LIMIT ?, ?
//       `;
//     }

//     // Query untuk menghitung total kandidat dengan status NULL
//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM tr_candidate_list cl
//       WHERE cl.status_candidate IS NULL OR cl.status_candidate = ''
//     `;

//     // Eksekusi query utama dan count
//     const candidates = await db.$queryRawUnsafe(query, offset, limit);
//     const countResult = await db.$queryRawUnsafe(countQuery);
    
//     // Convert BigInt to string
//     const sanitizedData = convertBigIntToString(candidates);
//     const totalItems = parseInt((countResult as any)[0].total.toString());
//     const totalPages = Math.ceil(totalItems / limit);

//     return res.status(200).json({ 
//       message: "Candidates with null status retrieved successfully",
//       data: sanitizedData,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalItems: totalItems,
//         itemsPerPage: limit
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching candidates with null status:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };