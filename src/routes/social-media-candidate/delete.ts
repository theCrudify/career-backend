import { Response, Request } from "express";
import { db } from "../../utils/db";

export const deleteSocialMedia = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const socialMediaId = Number(req.params.id);

  if (isNaN(socialMediaId)) {
    return res.status(400).json({ error: 'Invalid skill ID' });
  }

  try {
    const deletedSkill = await db.tr_social_media.delete({
      where: { id: socialMediaId },
    });

    return res.status(200).json({ message: 'Skill deleted successfully', deletedSkill });
  } catch (error) {
    console.error('Error deleting data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
