import { Response, Request } from "express";
import { db } from "../../utils/db";

export const deletedApply = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const applyId = Number(req.params.id);

  if (isNaN(applyId)) {
    return res.status(400).json({ error: 'Invalid skill ID' });
  }

  try {
    const deletedApply = await db.tr_candidate_list.delete({
      where: { id: applyId },
    });

    return res.status(200).json({ message: 'Apply deleted successfully', deletedApply });
  } catch (error) {
    console.error('Error deleting data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
