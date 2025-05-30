import { Response, Request } from "express";
import { db } from "../../utils/db";

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") return res.status(405);

  const count = await db.mst_career_area.count()
  const areas = await db.mst_career_area.findMany()
  
  return res.json({ count, data:areas });
};

export const post = async (req: Request, res: Response) => {
  try {
    console.log(req.body)
    const newCareerArea = await db.mst_career_area.create({
      data: req.body,
    });
    
    return res.status(201).json(newCareerArea);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create career area" });
  }
};