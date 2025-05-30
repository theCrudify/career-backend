import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const id = parseInt(req.params.id, 10);

    try {
        const data = await db.$queryRaw`
        select 
        a.id,
		a.position as Position, 
		b.site_description as Location, 
		a.status as JobType, 
		d.description as Education,
		a.expired_date as Deadline,
		a.specific_skill as SpecificSkill,
		a.description as Description,
        c.department as Department
        FROM 
            tr_job_requisition a
        LEFT JOIN 
            mst_site b ON a.site = b.id 
        LEFT JOIN 
            mst_department c ON a.department = c.id 
        LEFT JOIN 
            mst_education d ON a.education = d.id 
        where a.id = ${id}
        `;

        return res.status(200).json({ data });
    } catch (error) {
        console.error("ini error", error)
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};