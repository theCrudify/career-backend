import { Response, Request } from "express";
import { db } from "../../utils/db";
import { sendEmailNotification } from "../../template/EmailController";
import { candidateApplyEmail } from "../../template/email";

export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const candidateId = Number(req.params.id);
  const jobId = Number(req.params.num);
  const currentTimestamp = new Date().toISOString();

  try {
    await db.tr_candidate_list.create({
        data: {
            requisition_id: jobId,
            candidate_id: candidateId,
            created_at: currentTimestamp
        },
    });

    const dataCandidate = await db.tr_candidate_reg.findFirst({
      select: {
        full_name: true,
        email: true,
      },
      where: {
        id: candidateId,
      },
    });

    const jobDetail = await db.tr_job_requisition.findFirst({
      select: {
        position: true,
      },
      where: {
        id: jobId,
      },
    });

 
    if (!dataCandidate?.full_name || !dataCandidate?.email || !jobDetail?.position) {
      return res.status(400).json({ error: "Required data is missing." });
    }

    const emailContent = candidateApplyEmail({
      full_name: dataCandidate.full_name,
      position: jobDetail.position,
    });

    const emailData = {
      subject: "Thanks for Applying for the Job",
      to: dataCandidate.email,
      text: "",
      body: emailContent,
    };

    const emailSent = await sendEmailNotification(emailData);

    if (!emailSent) {
      console.error("Failed to send verification email.");
      return res.status(500).json({ error: "Failed to send verification email." });
    }

    return res.status(200).json({ message: "Application successfully submitted." });
  } catch (error) {
    console.error("Error processing application:", error);
    return res.status(500).json({ error: "An error occurred while processing your request." });
  }
};
