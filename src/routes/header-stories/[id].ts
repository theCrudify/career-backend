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
    const dataHeaderStories = await db.$queryRaw`
    select a.nickname, a.tagline_one, a.tagline_two, a.photo, a.color_code, a.bg_header, a.bg_type 
    from mst_stories a
    where id =  ${Id}
        `;

    const sanitizedDataHeaderStories = convertBigIntToString( dataHeaderStories );

    return res.status(200).json({ data: sanitizedDataHeaderStories });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
