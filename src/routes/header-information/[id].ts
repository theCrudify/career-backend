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
    const dataHeaderInformation = await db.$queryRaw`
    select a.file_foto, a.full_name  
    from tr_candidate_reg a
    where id = ${candidateId}
        `;

    const sanitizedDataHeaderInformation = convertBigIntToString(dataHeaderInformation );

    return res.status(200).json({ data: sanitizedDataHeaderInformation });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
