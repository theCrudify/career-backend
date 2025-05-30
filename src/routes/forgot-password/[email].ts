import { db } from "../../utils/db";
import { Response, Request } from "express";
import { sendEmailNotification } from "../../template/EmailController";
import { forgotPasswordEmail } from "../../template/email";

export const post = async (req: Request, res: Response) => {

  console.log("req body", req.body)
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  console.log("req body", req.params.email)

  try {
    
    const data = await db.tr_candidate_reg.findFirst({
      select: {
        id: true,  
      },
      where: {
        email: req.params.email, 
      },
    });

    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    const emailContent = forgotPasswordEmail({
        id: data.id
      });
  
      const emailData = {
        subject: "Please Reset Your Password",
        to: req.params.email,
        text: "",
        body: emailContent,
      };
  
      const emailSent = await sendEmailNotification(emailData);

      if (!emailSent) {
        console.error("Failed to send verification email.");
        return res.status(500).json({ error: "Failed to send verification email." });
      }


    return res.json({ status: data.id });
  } catch (error) {
  
    return res.status(500).json({ message: "An error occurred", error });
  }
};
