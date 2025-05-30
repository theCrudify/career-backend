import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data = await db.$queryRaw`
        SELECT agreement, detail FROM mst_agreement WHERE id = 1
            `;

    return res.status(200).json({data});
  } catch (error) {
    console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
  }
};
