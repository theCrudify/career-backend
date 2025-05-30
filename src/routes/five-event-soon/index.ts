import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data = await db.$queryRaw`
        SELECT
            id,
            name,
            description,
            location,
            start_date,
            end_date,
            picture,
            hyperlink,
            company 
        FROM mst_event WHERE start_date > NOW() 
        ORDER BY
            start_date ASC 
            LIMIT 5;
            `;

    return res.status(200).json({data});
  } catch (error) {
    console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
  }
};
