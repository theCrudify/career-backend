import { db } from "../../utils/db";
import { Response, Request } from "express";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405);

  const data = await db.mst_career_area.findUnique({
    where: {
      id: parseInt(req.params.id) as number,
    },
  });

  return res.json({data});
};

export const put = async (req: Request, res: Response) => {
  try {
    const updatedCareerArea = await db.mst_career_area.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    return res.json(updatedCareerArea);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update career area" });
  }
};

export const del = async (req: Request, res: Response) => {
  try {
    await db.mst_career_area.delete({
      where: { id: parseInt(req.params.id) },
    });
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete career area" });
  }
};