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

  try {
    // Mengambil daftar kandidat yang belum dibaca (status_candidate = 1)
    const unreadCandidates = await db.$queryRaw`
      SELECT 
        cl.id,
        cr.full_name,
        cr.email,
        cr.file_foto,
        jr.position,
        cl.created_at as apply_date,
        cl.status_candidate
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE cl.status_candidate = 1
      ORDER BY cl.created_at DESC
    `;

    const sanitizedData = convertBigIntToString(unreadCandidates);

    return res.status(200).json({ 
      message: "Unread candidates retrieved successfully",
      data: sanitizedData
    });
  } catch (error) {
    console.error("Error fetching unread candidates:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};