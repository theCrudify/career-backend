import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const data = await db.$queryRaw`
            SELECT * FROM mst_province
        `;

        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};