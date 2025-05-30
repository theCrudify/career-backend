import { Response, Request } from "express";
import { db } from "../../utils/db";
import { sendEmailNotification } from "../../template/EmailController";
import { candidateAcceptedEmail } from "../../template/candidate-status-email";

// Interface untuk request body interview
interface InterviewRequestBody {
  interview_date: string;
  interview_time: string;
  interview_location: string;
  interviewer: string;
  notes?: string;
  user_id: number;
}

export const scheduleInterview = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const candidateListId = Number(req.params.id);
  const interviewData: InterviewRequestBody = req.body;

  // Validasi data interview
  if (!interviewData.interview_date || !interviewData.interview_time || !interviewData.interview_location) {
    return res.status(400).json({ error: 'Interview date, time, and location are required' });
  }

  try {
    // Cek apakah kandidat ada menggunakan raw query untuk menghindari masalah tipe
    const candidateQuery = `
      SELECT 
        cl.id as candidate_list_id,
        cr.id as candidate_reg_id,
        cr.full_name,
        cr.email,
        jr.id as job_id,
        jr.position
      FROM tr_candidate_list cl
      JOIN tr_candidate_reg cr ON cl.candidate_id = cr.id
      JOIN tr_job_requisition jr ON cl.requisition_id = jr.id
      WHERE cl.id = ?
    `;
    
    const candidateResult = await db.$queryRawUnsafe(candidateQuery, candidateListId);
    
    if (!candidateResult || (candidateResult as any[]).length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidateData = (candidateResult as any[])[0];

    // Ubah status kandidat menjadi "Invited for Interview" (kode status 3)
    await db.tr_candidate_list.update({
      where: { id: candidateListId },
      data: { 
        status_candidate: 3 // Status "Invited for Interview"
      }
    });

    // Catat jadwal interview di database
    const interviewPlanDate = new Date(interviewData.interview_date);
    
    const interview = await db.tr_interview.create({
      data: {
        candidate_list_id: candidateListId,
        status_candidate: 3,
        interviewer: interviewData.interviewer,
        plan_date: interviewPlanDate,
        plan_time: interviewData.interview_time,
        is_fix: "1", // Fixed schedule
        note: interviewData.notes || "",
        location: interviewData.interview_location,
        created_at: new Date(),
        created_by: String(interviewData.user_id),
        interview_type: "Online" // Default ke online, bisa diganti sesuai kebutuhan
      }
    });

    // Log aktivitas ini
    await db.tr_candidate_log.create({
      data: {
        candidate_list_id: candidateListId,
        action: "Schedule Interview",
        location: interviewData.interview_location,
        result: "",
        status_candidate: "3",
        created_at: new Date(),
        plan_date: interviewPlanDate,
        created_by: interviewData.user_id
      }
    });

    // Format tanggal untuk email
    const formattedDate = interviewPlanDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Kirim email undangan interview
    const emailContent = candidateAcceptedEmail({
      full_name: candidateData.full_name || "",
      position: candidateData.position || "",
      status: "accepted",
      interview_date: formattedDate,
      interview_time: interviewData.interview_time,
      interview_location: interviewData.interview_location
    });

    const emailData = {
      subject: "Undangan Interview - PT Amerta Indah Otsuka",
      to: candidateData.email || "",
      text: "",
      body: emailContent
    };

    const emailSent = await sendEmailNotification(emailData);

    if (!emailSent) {
      console.error("Failed to send interview invitation email.");
      return res.status(200).json({
        message: 'Interview scheduled successfully, but email notification failed',
        interview
      });
    }

    return res.status(200).json({
      message: 'Interview scheduled successfully and invitation sent',
      interview
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mendapatkan data jadwal interview kandidat
export const getInterviewSchedule = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const candidateListId = Number(req.params.id);

  try {
    const interviewData = await db.tr_interview.findMany({
      where: { 
        candidate_list_id: candidateListId 
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!interviewData || interviewData.length === 0) {
      return res.status(404).json({ 
        message: 'No interview schedule found for this candidate'
      });
    }

    return res.status(200).json({
      message: 'Interview schedule retrieved successfully',
      data: interviewData
    });
  } catch (error) {
    console.error('Error fetching interview schedule:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};