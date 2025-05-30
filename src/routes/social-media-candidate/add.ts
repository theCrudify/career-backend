import { Response, Request } from "express";
import { db } from "../../utils/db";

interface CustomRequest extends Request {
  body: {
    social_media: string;
    candidate_id: string;
  };
}

export const postSocialMedia = async (req: CustomRequest, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Received Request Data:", req.body);

  const { social_media, candidate_id } = req.body;

  const candidateIdNumber = parseInt(candidate_id, 10);

  if (isNaN(candidateIdNumber)) {
    return res.status(400).json({ error: "Invalid candidate ID." });
  }

  const parsedSocialMedia = social_media ? JSON.parse(social_media) : [];

  try {
    if (parsedSocialMedia && parsedSocialMedia.length > 0) {
        for (const social of parsedSocialMedia) {
          await db.tr_social_media.create({
            data: {
              candidate_id: candidateIdNumber,
              platform: social.platform,
              account: social.account,
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

