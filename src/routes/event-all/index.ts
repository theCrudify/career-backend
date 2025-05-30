import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") return res.status(405);

    const data = await db.mst_event.findMany({
        select: {
            id: true,
            name: true,
            description: true,
            location: true,
            start_date: true,
            end_date: true,
            picture: true,
            hyperlink: true,
            company: true,
            detail: true,
        }
    });

    return res.json({data});
}