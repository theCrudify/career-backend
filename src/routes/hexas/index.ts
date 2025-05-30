import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") return res.status(405);

    const data = await db.mst_hexa.findMany();

    return res.json({data});
}