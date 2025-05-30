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
    select cv, file_ktp, file_kk, file_npwp, file_rekening, file_bpjs_kerja, file_bpjs_sehat, file_transkrip, file_sim_a, file_sim_c, file_ijazah, file_foto_formal, file_skck
    from tr_candidate_reg 
    where id = ${candidateId}
        `;

    const sanitizedDataHeaderInformation = convertBigIntToString(dataHeaderInformation );

    return res.status(200).json({ data: sanitizedDataHeaderInformation });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
