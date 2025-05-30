import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405);

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
            company,
            detail
        FROM mst_event WHERE end_date < NOW() 
            ORDER BY
                start_date ASC;
    `;

  return res.json({ data });
};
