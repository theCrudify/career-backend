import { Response, Request } from "express";
import { db } from "../../utils/db";

export const getSocialMediaById = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const id = parseInt(req.params.id, 10);

    try {
        const data = await db.$queryRaw`
            SELECT * FROM tr_social_media where id = ${id}
        `;

        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};