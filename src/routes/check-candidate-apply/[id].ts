import { Response, Request } from "express";
import { db } from "../../utils/db";

interface CandidateReg {
    id: number;
    email: string;
}

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const id = req.params.id;
        const candidate_id = req.params.candidate

        const data: CandidateReg[] = await db.$queryRaw<CandidateReg[]>`
            SELECT *
            FROM tr_candidate_list
            WHERE requisition_id = ${id} and candidate_id = ${candidate_id}
        `;

        if (data.length > 0) {
            return res.status(200).json({ message: "Apply is Found", data });
        } else {
            return res.status(404).json({ message: "Apply Not Found" });
        }
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
};
