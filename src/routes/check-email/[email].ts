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
        const email = req.params.email;

        const data = await db.tr_candidate_reg.findFirst({
            select: {
              email: true,  
            },
            where: {
              email:email, 
            },
          });

        if (data) {
            return res.status(200).json({ message: "Email is Found", data });
        } else {
            return res.status(200).json({ message: "Email Not Found" });
        }
    } catch (error) {
        console.error(error)
        // return res.status(500).json({ error: (error as Error).message });
    }
};
