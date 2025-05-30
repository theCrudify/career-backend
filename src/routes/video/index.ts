import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data = await db.mst_video.findFirst({
      select: {
        name: true,
        url: true,
      }
    });

    return res.json({ data });
  } catch (error) {
    console.info(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}