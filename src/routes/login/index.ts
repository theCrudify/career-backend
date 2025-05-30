import { Response, Request } from "express";
import { db } from "../../utils/db";
import jwt from "jsonwebtoken";
import md5 from "md5";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST")
    return res.status(405).json({
      error: "Method Not Allowed",
    });

  const { email, password } = req.body;

  try {
    const data = await db.tr_candidate_reg.findFirst({
      select: {
        full_name: true,
        email: true,
      },
      where: {
        email: email,
        password: md5(password),
      },
    });

    if (data === null) {
      return res.status(200).json({ message: "Record not found" });
    } else {

      const token = jwt.sign({ email: data.email }, JWT_SECRET, {
        expiresIn: "1h",
      });
      
      const dataCandidate = await db.tr_candidate_reg.findFirst({
        where: {
          email: email
        }
    })

    console.log("data candidate", dataCandidate)
      

      return res.status(200).json({
        data: dataCandidate,
        token,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
