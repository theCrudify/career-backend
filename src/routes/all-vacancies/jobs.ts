import { Request, Response } from "express";
import { db } from "../../utils/db";

interface JobRequisition {
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

    const loc = req.query.loc as string | undefined;
    const job = req.query.job as string | undefined;
    const edu = req.query.edu as string | undefined;

    let query = `
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
    `;

    const params: any[] = [];
    if (loc) {
        query += ` AND b.site_description = ?`;
        params.push(loc);
    }
    if (job) {
        query += ` AND a.status = ?`;
        params.push(job);
    }
    if (edu) {
        query += ` AND d.description = ?`;
        params.push(edu);
    }

    try {
        const data: JobRequisition[] = await db.$queryRawUnsafe(query, ...params);
        const convertedData = data.map((item: JobRequisition) => ({
            ...item,
            DaysSinceCreation: item.DaysSinceCreation.toString()
        }));
        return res.status(200).json({ data: convertedData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Errorr' });
    }
};
