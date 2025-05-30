import { Response, Request } from "express";
import { db } from "../../utils/db";

interface DisplayCareers {
  id: number;
  department_name: string | null;
  banner: string | null;
  header: string | null;
  body: string | null;
  icon: string | null;
}

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const data: DisplayCareers[] = await db.mst_career_area.findMany({
			select: {
				id: true,
				department_name: true,
				banner: true,
				header: true,
				body: true,
				icon: true
			},
      take: 9,
    });

    return res.json({ data });
  } catch (error) {
    console.info(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
