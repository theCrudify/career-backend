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
    const dataSkill = await db.$queryRaw`
        select 
            a.id,
            a.skill,
            a.skill_rate 
        from 
            tr_skill_candidate a
        WHERE 
            a.id_candidate = ${candidateId};
        `;

    const sanitizedDataSkill = convertBigIntToString(dataSkill);

    return res.status(200).json({ resume: sanitizedDataSkill });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
