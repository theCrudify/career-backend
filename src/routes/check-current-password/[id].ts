import { Response, Request } from "express";
import { db } from "../../utils/db";
import crypto from "crypto";

interface CandidateReg {
    password: string;
}

export const post = async (req: Request, res: Response) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const id = Number(req.params.id);

    try {
        const password  = req.body.current_password;

        console.log("ini password", password)

        if (typeof password !== 'string') {
            return res.status(400).json({ error: 'Invalid password format' });
        }

        const data: CandidateReg[] = await db.$queryRaw<CandidateReg[]>`
            SELECT password
            FROM tr_candidate_reg 
            WHERE id = ${id}
        `;

        if (data.length > 0) {
            const hashedPassword = data[0].password;
            console.log('Hashed Password:', hashedPassword);
            const hashedInputPassword = crypto.createHash('md5').update(password).digest('hex');
            console.log('Input Hashed Password:', hashedInputPassword);

            if (hashedInputPassword === hashedPassword) {
                return res.status(200).json({ message: "Password is correct" });
            } else {
                return res.status(200).json({ message: "Invalid password" });
            }
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
};
