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

  const Id = Number(req.params.id);

  try {
    const dataHeaderStoriesDetail = await db.$queryRaw`
    select a.key, a.value 
    from mst_stories_detail a
    where a.stories_id =  ${Id}
        `;

    const sanitizedDataHeaderStoriesDetail = convertBigIntToString( dataHeaderStoriesDetail );

    return res.status(200).json({ data: sanitizedDataHeaderStoriesDetail });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
