import { Response, Request } from "express";
import { db } from "../../utils/db";

interface CustomRequest extends Request {
  body: {
    skills: string;
    candidate_id: string;
  };
}

export const postSkills = async (req: CustomRequest, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Received Request Data:", req.body);

  const { skills, candidate_id } = req.body;

  const candidateIdNumber = parseInt(candidate_id, 10);

  if (isNaN(candidateIdNumber)) {
    return res.status(400).json({ error: "Invalid candidate ID." });
  }

  const parsedSkills = skills ? JSON.parse(skills) : [];

  try {
    if (parsedSkills && parsedSkills.length > 0) {
      for (const skill of parsedSkills) {
        await db.tr_skill_candidate.create({
          data: {
            id_candidate: candidateIdNumber,
            skill: skill.skill,
            skill_rate: skill.skill_rate,
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

