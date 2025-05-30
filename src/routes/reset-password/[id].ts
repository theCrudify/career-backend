import { Response, Request } from "express";
import { db } from "../../utils/db";
import crypto from "crypto";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

export const put = async (req: CustomRequest, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Received Request Data:", req.body);

  const { password } = req.body;

  // Validate if password exists and is a string
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: "Password is required and must be a string." });
  }

  try {
    // Hash the password using MD5
    const hashedPassword = crypto
      .createHash("md5")
      .update(password)
      .digest("hex");

    const candidateId = Number(req.params.id);

    const newCandidate = await db.tr_candidate_reg.update({
      where: {
        id: candidateId,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res
      .status(200)
      .json({ message: "New password has been successfully saved." });
  } catch (error) {
    console.error("Error saving candidate data:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};
