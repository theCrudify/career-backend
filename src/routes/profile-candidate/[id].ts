import { Response, Request } from "express";
import { db } from "../../utils/db";


const convertBigIntToString = (data: any) => {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
};

export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const candidateId = Number(req.params.id);

    try {
        const dataResume = await db.$queryRaw`
            SELECT 
                a.full_name, 
                a.phone_number, 
                a.email,
                TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) AS age,
                a.domicile_city,
                b.description as education,
                a.institution,
                a.score,
                a.year_of_graduation,
                a.marital_status,
                a.religion,
                a.expected_salary,
                a.major,
                a.file_foto,
                a.emergency_contact_name,
                a.emergency_contact_status,
                a.emergency_contact_number
            FROM tr_candidate_reg a
            LEFT JOIN mst_education b ON a.education = b.id 
            WHERE a.id = ${candidateId};
        `;

        const sanitizedDataResume = convertBigIntToString(dataResume);

        return res.status(200).json({ resume: sanitizedDataResume });
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
