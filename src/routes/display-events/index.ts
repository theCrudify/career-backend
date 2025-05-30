import { Response, Request } from "express";
import { db } from "../../utils/db";

interface DisplayEvents {
	id: number;
	name: string | null;
	description: string | null,
	location: string | null;
	start_date: Date | null;
	end_date: Date | null;
	picture: string | null;
	hyperlink: string | null;
	company: number | null;
	detail: string | null;
}

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data: DisplayEvents[] = await db.mst_event.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        start_date: true,
        end_date: true,
        picture: true,
        hyperlink: true,
        company: true,
        detail: true,
      },
			orderBy: {
				created_at: "desc"
			}
    });
		return res.status(200).json({ data });
  } catch (error) {
		console.info(error);
    return res.status(500).json({ error: "Internal Server Error" });
	}
};
