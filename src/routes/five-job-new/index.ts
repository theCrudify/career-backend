import { Response, Request } from "express";
import { db } from "../../utils/db";

interface FiveJob {
    Title: string;
    Site: string;
    Degree: string;
    JobType: string;
    Deadline: string;
    Department: string;
    DaysSinceCreation: BigInt;
}

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const data: FiveJob[] = await db.$queryRaw`
        SELECT 
        a.position AS Title, 
        b.site_description AS Site, 
        d.description AS Degree, 
        a.status AS JobType, 
        a.expired_date AS Deadline, 
        c.department AS Department,
        a.id,
        TIMESTAMPDIFF(DAY, a.created_at, NOW()) AS DaysSinceCreation
        FROM 
            tr_job_requisition a
        LEFT JOIN 
            mst_site b ON a.site = b.id 
        LEFT JOIN 
            mst_department c ON a.department = c.id 
        LEFT JOIN 
            mst_education d ON a.education = d.id 
        WHERE 
            a.is_active = 1
        ORDER BY 
            a.created_at DESC
        LIMIT 5;
    
        `;

        const convertedData = data.map((item: FiveJob) => ({
            ...item,
            DaysSinceCreation: item.DaysSinceCreation.toString()
        }));

        return res.status(200).json({ data: convertedData });
    } catch (error) {
        console.error("ini error", error)
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};