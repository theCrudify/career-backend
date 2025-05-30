import { Response, Request } from "express";
import { db } from "../../utils/db";

interface CandidateReg {
    id: number;
    is_concent: number;
}

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log

    try {
        const id = req.params.id;
        console.log("ini id", id)

        const data: CandidateReg[] = await db.$queryRaw<CandidateReg[]>`
            SELECT is_consent
            FROM tr_candidate_reg 
            WHERE id = ${id}
        `;

        if (data.length > 0) {
            return res.status(200).json({ message: "Data is Found", data });
        } else {
            return res.status(404).json({ message: "Data Not Found" });
        }
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
};
