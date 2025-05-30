// src/routes/status-definitions/index.ts
import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const statuses = await db.mst_status_candidate.findMany({
      orderBy: { seq: 'asc' }
    });

    return res.status(200).json({ statuses });
  } catch (error) {
    console.error("Error fetching statuses:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};