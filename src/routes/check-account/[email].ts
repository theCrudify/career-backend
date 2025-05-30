import { db } from "../../utils/db";
import { Response, Request } from "express";

export const get = async (req: Request, res: Response) => {

  console.log("req body", req.body)
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    
    const data = await db.tr_candidate_reg.findFirst({
      select: {
        status: true,  
      },
      where: {
        email: req.params.email, 
      },
    });

    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }


    return res.json({ status: data.status });
  } catch (error) {
  
    return res.status(500).json({ message: "An error occurred", error });
  }
};
