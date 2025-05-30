// src/routes/apply-list/[id].ts
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
    const dataApplyCandidate = await db.$queryRaw`
        select a.id, b.position, c.site_description, d.level_description, b.placement_date, 
               a.status_candidate, sc.status as status_name, sc.type as status_type
        from tr_candidate_list a
        left join tr_job_requisition b on a.requisition_id = b.id
        left join mst_site c on b.site = c.id 
        left join mst_level d on b.level = d.id
        left join mst_status_candidate sc on a.status_candidate = sc.id
        where a.candidate_id = ${candidateId}
        `;

    const sanitizedDataApplyCandidate =
      convertBigIntToString(dataApplyCandidate);

    return res.status(200).json({ apply: sanitizedDataApplyCandidate });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};