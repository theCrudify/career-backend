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
    // Parse query parameters untuk filter
    const status = req.query.status as string;
    const position = req.query.position as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        cl.id,
        cr.full_name,
        cr.email,
        cr.file_foto,
        jr.position,
        cl.created_at as apply_date,
        cl.status_candidate,
        sc.status as status_name
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      JOIN mst_status_candidate sc ON cl.status_candidate = sc.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter berdasarkan status
    if (status) {
      query += ` AND cl.status_candidate = ?`;
      params.push(parseInt(status));
    }

    // Filter berdasarkan posisi
    if (position) {
      query += ` AND jr.position LIKE ?`;
      params.push(`%${position}%`);
    }

    // Menambahkan ordering dan pagination
    query += ` ORDER BY cl.created_at DESC LIMIT ?, ?`;
    params.push(offset, limit);

    // Mengambil total data untuk pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE 1=1
    `;

    const countParams: any[] = [];

    // Filter berdasarkan status untuk count
    if (status) {
      countQuery += ` AND cl.status_candidate = ?`;
      countParams.push(parseInt(status));
    }

    // Filter berdasarkan posisi untuk count
    if (position) {
      countQuery += ` AND jr.position LIKE ?`;
      countParams.push(`%${position}%`);
    }

    // Eksekusi query untuk mendapatkan data
    const candidates = await db.$queryRawUnsafe(query, ...params);
    const sanitizedData = convertBigIntToString(candidates);

    // Eksekusi query untuk mendapatkan total data
    const countResult = await db.$queryRawUnsafe(countQuery, ...countParams);
    const totalItems = parseInt((countResult as any)[0].total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({ 
      message: "Candidates retrieved successfully",
      data: sanitizedData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};