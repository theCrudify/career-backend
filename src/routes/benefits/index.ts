import { Response, Request } from "express";
import { db } from "../../utils/db";

interface Benefits {
  id: number;
  name: string | null;
  description: string | null;
  picture: string | null;
}

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data: Benefits[] = await db.mst_benefit.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        picture: true,
      },
    });
    return res.json({ data });
  } catch (error) {
		console.info(error);
    return res.status(500).json({ error: "Internal Server Error" });
	}
};
