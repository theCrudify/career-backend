import { Response, Request } from "express";
import { db } from "../../utils/db";

export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const socialMediaId = Number(req.params.id);

  console.log("req bodyyyyyyy", req.body)

  try {
    const updatedCandidate = await db.tr_social_media.update({
      where: { id: socialMediaId },
      data: req.body, 
    });

    return res.status(200).json({ message: 'Resume updated successfully', updatedCandidate });
  } catch (error) {
    console.error('Error updating data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
