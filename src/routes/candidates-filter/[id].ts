import { Response, Request } from "express";
import { db } from "../../utils/db";

const convertBigIntToString = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const candidateListId = Number(req.params.id);

  try {
    // Ambil data utama kandidat
    const candidateDataQuery = `
      SELECT 
        cl.id as candidateListId,
        cl.requisition_id as jobId,
        cl.candidate_id as candidateRegId,
        cl.status_candidate as statusCode,
        sc.status as statusName,
        cl.created_at as applyDate,
        jr.position as jobPosition,
        jr.department as departmentId,
        dep.department as departmentName,
        jr.site as siteId,
        site.site_description as siteName,
        cr.full_name,
        cr.email,
        cr.phone_number,
        cr.birth_date,
        TIMESTAMPDIFF(YEAR, cr.birth_date, CURDATE()) as age,
        cr.gender,
        cr.marital_status,
        cr.religion,
        cr.domicile_province,
        prov.province as provinceName,
        cr.domicile_city,
        city.name as cityName,
        cr.domicile_address,
        cr.education as educationId,
        edu.description as educationName,
        cr.institution,
        cr.major,
        cr.year_of_graduation,
        cr.score,
        cr.expected_salary,
        cr.is_fresh_graduate,
        cr.file_foto,
        cr.cv,
        cr.emergency_contact_name,
        cr.emergency_contact_status,
        cr.emergency_contact_number
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      JOIN mst_status_candidate sc ON cl.status_candidate = sc.id
      LEFT JOIN mst_department dep ON jr.department = dep.id
      LEFT JOIN mst_site site ON jr.site = site.id
      LEFT JOIN mst_education edu ON cr.education = edu.id
      LEFT JOIN mst_province prov ON cr.domicile_province = prov.id
      LEFT JOIN mst_city city ON cr.domicile_city = city.name
      WHERE cl.id = ?
    `;

    // Ambil pengalaman kerja kandidat
    const experiencesQuery = `
      SELECT 
        id,
        experience_company,
        experience_position,
        experience_salary,
        experience_start_date,
        experience_end_date,
        experience_job_level,
        experience_description,
        is_currently_working
      FROM tr_experience_candidate
      WHERE id_candidate = (
        SELECT candidate_id FROM tr_candidate_list WHERE id = ?
      )
      ORDER BY experience_start_date DESC
    `;

    // Ambil skill kandidat
    const skillsQuery = `
      SELECT 
        id,
        skill,
        skill_rate
      FROM tr_skill_candidate
      WHERE id_candidate = (
        SELECT candidate_id FROM tr_candidate_list WHERE id = ?
      )
    `;

    // Ambil sosial media kandidat
    const socialMediaQuery = `
      SELECT 
        id,
        platform,
        account
      FROM tr_social_media
      WHERE candidate_id = (
        SELECT candidate_id FROM tr_candidate_list WHERE id = ?
      )
    `;

    // Ambil riwayat perubahan status kandidat
    const statusHistoryQuery = `
      SELECT 
        id,
        candidate_list_id,
        action,
        result,
        status_candidate,
        created_at,
        created_by
      FROM tr_candidate_log
      WHERE candidate_list_id = ?
      ORDER BY created_at DESC
    `;

    // Ambil riwayat interview
    const interviewHistoryQuery = `
      SELECT 
        id,
        candidate_list_id,
        status_candidate,
        interviewer,
        plan_date,
        plan_time,
        location,
        note,
        created_at,
        created_by,
        interview_type
      FROM tr_interview
      WHERE candidate_list_id = ?
      ORDER BY plan_date DESC, created_at DESC
    `;

    // Eksekusi semua query
    const candidateData = await db.$queryRawUnsafe(candidateDataQuery, candidateListId);
    const experiences = await db.$queryRawUnsafe(experiencesQuery, candidateListId);
    const skills = await db.$queryRawUnsafe(skillsQuery, candidateListId);
    const socialMedia = await db.$queryRawUnsafe(socialMediaQuery, candidateListId);
    const statusHistory = await db.$queryRawUnsafe(statusHistoryQuery, candidateListId);
    const interviewHistory = await db.$queryRawUnsafe(interviewHistoryQuery, candidateListId);

    // Convert BigInt to string untuk semua hasil
    const sanitizedCandidateData = convertBigIntToString(candidateData);
    const sanitizedExperiences = convertBigIntToString(experiences);
    const sanitizedSkills = convertBigIntToString(skills);
    const sanitizedSocialMedia = convertBigIntToString(socialMedia);
    const sanitizedStatusHistory = convertBigIntToString(statusHistory);
    const sanitizedInterviewHistory = convertBigIntToString(interviewHistory);

    // Jika kandidat tidak ditemukan
    if (!sanitizedCandidateData || sanitizedCandidateData.length === 0) {
      return res.status(404).json({ 
        message: "Candidate not found" 
      });
    }

    // Menghitung total pengalaman kerja (dalam bulan)
    let totalExperienceMonths = 0;
    sanitizedExperiences.forEach((exp: any) => {
      const startDate = new Date(exp.experience_start_date);
      const endDate = exp.is_currently_working === "1" ? 
        new Date() : // Jika masih bekerja, gunakan tanggal saat ini
        (exp.experience_end_date ? new Date(exp.experience_end_date) : new Date());
      
      // Hitung selisih bulan
      const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth());
      
      totalExperienceMonths += diffMonths > 0 ? diffMonths : 0;
    });

    // Format total pengalaman dalam tahun dan bulan
    const experienceYears = Math.floor(totalExperienceMonths / 12);
    const experienceMonths = totalExperienceMonths % 12;
    const totalExperience = `${experienceYears} tahun ${experienceMonths} bulan`;

    // Return response dengan semua data yang telah diambil
    return res.status(200).json({
      message: "Candidate details retrieved successfully",
      data: {
        candidateDetail: sanitizedCandidateData[0],
        experiences: sanitizedExperiences,
        skills: sanitizedSkills,
        socialMedia: sanitizedSocialMedia,
        totalExperience: totalExperience,
        totalExperienceMonths: totalExperienceMonths,
        statusHistory: sanitizedStatusHistory,
        interviewHistory: sanitizedInterviewHistory
      }
    });
  } catch (error) {
    console.error("Error fetching candidate details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};