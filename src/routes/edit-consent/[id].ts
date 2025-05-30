import { Response, Request } from "express";
import { db } from "../../utils/db";

export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Received Request Data:", req.body);
  console.log("req params", req.params.id);

  const id = Number(req.params.id);
  const is_consent = req.body.consent;

  const consent = parseInt(is_consent, 10);

  try {

    await db.$executeRaw`
    UPDATE tr_candidate_reg SET is_consent = ${consent} WHERE id = ${id}`;

    return res.status(200).json({ message: "Consent status updated successfully." });
  } catch (error) {
    console.error("Error updating consent status:", error);
    return res.status(500).json({ error: "An error occurred while updating consent status." });
  }
};
