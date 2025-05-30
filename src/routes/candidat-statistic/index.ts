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

  // Filter parameter optional
  const position = req.query.position as string;
  const startDate = req.query.start_date as string;
  const endDate = req.query.end_date as string;

  try {
    // Base query dengan parameter yang akan ditambahkan
    let statsQueryParams: any[] = [];
    let statsWhereClause = "";

    // Filter by position
    if (position) {
      statsWhereClause += " AND jr.position LIKE ?";
      statsQueryParams.push(`%${position}%`);
    }

    // Filter by date range
    if (startDate && endDate) {
      statsWhereClause += " AND cl.created_at BETWEEN ? AND ?";
      statsQueryParams.push(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      statsWhereClause += " AND cl.created_at >= ?";
      statsQueryParams.push(new Date(startDate));
    } else if (endDate) {
      statsWhereClause += " AND cl.created_at <= ?";
      statsQueryParams.push(new Date(endDate));
    }

    // Query untuk jumlah kandidat berdasarkan status
    const statusCountsQuery = `
      SELECT 
        sc.id as status_id,
        sc.status as status_name,
        COUNT(cl.id) as count
      FROM mst_status_candidate sc
      LEFT JOIN tr_candidate_list cl ON sc.id = cl.status_candidate
        ${statsWhereClause ? "AND" + statsWhereClause.substring(4) : ""}
      LEFT JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      GROUP BY sc.id, sc.status
      ORDER BY sc.seq
    `;

    // Query untuk jumlah kandidat berdasarkan posisi yang dilamar
    const positionCountsQuery = `
      SELECT 
        jr.position,
        COUNT(cl.id) as count
      FROM tr_job_requisition jr
      LEFT JOIN tr_candidate_list cl ON jr.id = cl.requisition_id
      WHERE jr.is_active = 1
        ${statsWhereClause}
      GROUP BY jr.position
      ORDER BY count DESC
      LIMIT 10
    `;

    // Query untuk kandidat baru per hari (last 30 days)
    const dailyApplicationsQuery = `
      SELECT 
        DATE(cl.created_at) as date,
        COUNT(cl.id) as count
      FROM tr_candidate_list cl
      LEFT JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE cl.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${statsWhereClause}
      GROUP BY DATE(cl.created_at)
      ORDER BY date ASC
    `;

    // Query untuk mendapatkan total kandidat
    const totalCandidatesQuery = `
      SELECT COUNT(cl.id) as total
      FROM tr_candidate_list cl
      LEFT JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE 1=1
        ${statsWhereClause}
    `;

    // Eksekusi semua query
    const statusCounts = await db.$queryRawUnsafe(statusCountsQuery, ...statsQueryParams);
    const positionCounts = await db.$queryRawUnsafe(positionCountsQuery, ...statsQueryParams);
    const dailyApplications = await db.$queryRawUnsafe(dailyApplicationsQuery, ...statsQueryParams);
    const totalCandidatesResult = await db.$queryRawUnsafe(totalCandidatesQuery, ...statsQueryParams);

    // Convert BigInt to string
    const sanitizedStatusCounts = convertBigIntToString(statusCounts);
    const sanitizedPositionCounts = convertBigIntToString(positionCounts);
    const sanitizedDailyApplications = convertBigIntToString(dailyApplications);
    const totalCandidates = convertBigIntToString(totalCandidatesResult)[0].total;

    // Hitung persentase untuk status
    let totalStatusCount = 0;
    sanitizedStatusCounts.forEach((status: any) => {
      totalStatusCount += parseInt(status.count);
    });

    const statusWithPercentage = sanitizedStatusCounts.map((status: any) => {
      const count = parseInt(status.count);
      const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
      return {
        ...status,
        percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
      };
    });

    return res.status(200).json({
      message: "Candidate statistics retrieved successfully",
      data: {
        totalCandidates,
        statusCounts: statusWithPercentage,
        positionCounts: sanitizedPositionCounts,
        dailyApplications: sanitizedDailyApplications
      }
    });
  } catch (error) {
    console.error("Error fetching candidate statistics:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};