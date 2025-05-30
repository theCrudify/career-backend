import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") return res.status(405).json({error: "Method Not Allowed"});

    const id = parseInt(req.params.id);

    try {
        const data = await db.mst_event.findUnique({
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
            },
            where: {
                id: id
            }
        });

        return res.status(200).json({data});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}