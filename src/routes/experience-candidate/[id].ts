import { Response, Request } from "express";
import { db } from "../../utils/db";

const convertBigIntToString = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const candidateId = Number(req.params.id);

  try {
    const dataExperience = await db.$queryRaw`
        select 
          a.id,
	        a.experience_company, 
	        a.experience_position,
	        a.experience_start_date,
	        a.experience_end_date 
        from tr_experience_candidate a
        WHERE a.id_candidate = ${candidateId};
        `;

    const sanitizedDataExperience= convertBigIntToString(dataExperience);

    return res.status(200).json({ resume: sanitizedDataExperience });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
