import { Response, Request } from "express";
import { db } from "../../utils/db";

export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log(req.body);

  const dateString = req.body.date;
  const date = new Date(dateString); 

  try {
    const dataVisitor = await db.tr_visitor.findFirst({
      select: {
        id: true,
        visit_date: true,
        total_visit: true
      },
      where: {
        visit_date: date 
      }
    });

    if (dataVisitor) {
      let totalVisitor = dataVisitor.total_visit || 0;
      totalVisitor += 1;

      await db.tr_visitor.update({
        where: { id: dataVisitor.id },
        data: {
          total_visit: totalVisitor
        },
      });
    } else {
      await db.tr_visitor.create({
        data: {
          visit_date: date,
          total_visit: 1
        },
      });
    }

    return res.status(200).json({ message: "Visitor processed successfully." });
  } catch (error) {
    console.error("Error processing application:", error);
    return res.status(500).json({ error: "An error occurred while processing your request." });
  }
};
