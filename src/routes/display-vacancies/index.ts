import { Response, Request } from "express";
import { db } from "../../utils/db";

interface DisplayJobs {
    id: number;
    Title: string;
    Degree: string;
    JobType: string;
    Deadline: string;
    Department: string;
    DaysSinceCreation: BigInt;
}

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Mehtod Not Allowed" });
    }

    try {
        const data: DisplayJobs[] = await db.$queryRaw`
            SELECT
                a.id,
                a.position AS Title,
                b.site_description AS Site,
                d.description AS Degree,
                a.status AS JobType,
                a.expired_date AS Deadline,
                c.department AS Department,
                TIMESTAMPDIFF(
                    DAY,
                    a.created_at,
                NOW()) AS DaysSinceCreation 
            FROM
                tr_job_requisition a
                LEFT JOIN mst_site b ON a.site = b.id
                LEFT JOIN mst_department c ON a.department = c.id
                LEFT JOIN mst_education d ON a.education = d.id 
            WHERE
                a.is_active = 1 
            ORDER BY
                a.created_at DESC 
                LIMIT 6;
        `
        const convertedData = data.map((item: DisplayJobs) => ({
            ...item,
            DaysSinceCreation: item.DaysSinceCreation.toString()
        }));

        return res.status(200).json({ data: convertedData })
    } catch (error) {
        console.info(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}