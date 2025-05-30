import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // Set header untuk mencegah caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const data = await db.$queryRaw`
        SELECT * FROM mst_banner_profile
            `;

    return res.status(200).json({data});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};