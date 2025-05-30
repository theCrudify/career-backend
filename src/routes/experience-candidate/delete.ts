import { Response, Request } from "express";
import { db } from "../../utils/db";

export const deleteExperience = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const experienceId = Number(req.params.id);

  if (isNaN(experienceId)) {
    return res.status(400).json({ error: 'Invalid skill ID' });
  }

  try {
    const deletedExperience = await db.tr_experience_candidate.delete({
      where: { id: experienceId },
    });

    return res.status(200).json({ message: 'Skill deleted successfully', deletedExperience });
  } catch (error) {
    console.error('Error deleting data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
