import { Response, Request } from "express";
import { db } from "../../utils/db";

interface StoriesDisplay {
  id: number;
  name: string | null;
  poster: string | null;
  position: string | null;
}

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data: StoriesDisplay[] = await db.mst_stories.findMany({
      select: {
        id: true,
        name: true,
        poster: true,
        position: true
      }
    });
    return res.status(200).json({ data });
  } catch (error) {
    console.info(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}