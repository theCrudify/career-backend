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
    const dataAll = await db.$queryRaw`
    SELECT 
    a.full_name, 
    a.phone_number, 
    a.email, 
    a.birth_date, 
    a.domicile_province, 
    a.domicile_city, 
    a.domicile_address, 
    a.marital_status, 
    a.religion, 
    a.expected_salary,
    a.education,
    a.major,
    a.score,
    a.year_of_graduation,
    a.is_abroad,
    a.institution,
    a.emergency_contact_name,
    a.emergency_contact_status,
    a.emergency_contact_number
  FROM 
    tr_candidate_reg a
  LEFT JOIN mst_province b on a.domicile_province = b.id
  WHERE 
    a.id = ${candidateId};
        `;

    const sanitizedDataAll = convertBigIntToString(dataAll);

    return res.status(200).json({ allData: sanitizedDataAll });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
