import { Response, Request } from "express";
import { db } from "../../utils/db";

interface CustomRequest extends Request {
  body: {
    experience: string;
    candidate_id: string;
  };
}

export const postExperience = async (req: CustomRequest, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Received Request Data:", req.body);

  const { experience, candidate_id } = req.body;

  const candidateIdNumber = parseInt(candidate_id, 10);

  if (isNaN(candidateIdNumber)) {
    return res.status(400).json({ error: "Invalid candidate ID." });
  }

  const parsedExperience = experience ? JSON.parse(experience) : [];

  if (isNaN(candidateIdNumber)) {
    return res.status(400).json({ error: "Invalid candidate ID." });
  }

  try {
    if (parsedExperience && parsedExperience.length > 0) {
        for (const exp of parsedExperience) {
          await db.tr_experience_candidate.create({
            data: {
              id_candidate: candidateIdNumber,
              experience_company: exp.company,
              experience_position: exp.position,
              experience_salary: exp.salary,
              experience_start_date: new Date(exp.start_date),
              experience_end_date: exp.end_date ? new Date(exp.end_date) : null,
              experience_job_level: String(exp.job_level),
              experience_description: exp.description,
              is_currently_working: String(exp.is_currently_working),
            },
          });
        }
      }

    return res.status(200).json({ message: "Skills have been successfully added." });
  } catch (error) {
    console.error("Error saving skills:", error);
    return res.status(500).json({ error: "An error occurred while processing your request." });
  }
};

