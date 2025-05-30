import { Response, Request } from "express";
import { db } from "../../../../utils/db";

/**
 * Konversi BigInt ke string untuk memastikan kompatibilitas JSON
 */
const convertBigIntToString = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

/**
 * Mendapatkan daftar catatan interview dan evaluasi untuk kandidat tertentu
 */
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const candidateListId = Number(req.params.id);

  try {
    // Mendapatkan catatan interview (dari tabel tr_interview dan tr_interview_result)
    const interviewNotesQuery = `
      SELECT 
        i.id as interview_id,
        i.plan_date,
        i.plan_time,
        i.location,
        i.interviewer,
        i.note as general_note,
        i.interview_type,
        i.created_at,
        i.created_by,
        ir.id as result_id,
        ir.point,
        ir.note as detailed_note,
        ir.interviewer as evaluator
      FROM tr_interview i
      LEFT JOIN tr_interview_result ir ON i.id = ir.interview_id
      WHERE i.candidate_list_id = ?
      ORDER BY i.plan_date DESC, i.created_at DESC
    `;

    // Mendapatkan komentar tambahan dan feedback (dari tr_candidate_log)
    const feedbackQuery = `
      SELECT 
        id,
        action,
        result as feedback,
        location,
        status_candidate,
        created_at,
        created_by
      FROM tr_candidate_log
      WHERE candidate_list_id = ? AND (action LIKE '%Interview%' OR action LIKE '%Feedback%' OR result != '')
      ORDER BY created_at DESC
    `;

    // Eksekusi semua query
    const interviewNotes = await db.$queryRawUnsafe(interviewNotesQuery, candidateListId);
    const feedbackEntries = await db.$queryRawUnsafe(feedbackQuery, candidateListId);

    // Convert BigInt to string untuk semua hasil
    const sanitizedInterviewNotes = convertBigIntToString(interviewNotes);
    const sanitizedFeedbackEntries = convertBigIntToString(feedbackEntries);

    return res.status(200).json({
      message: "Candidate interview notes retrieved successfully",
      data: {
        interviewNotes: sanitizedInterviewNotes,
        feedbackEntries: sanitizedFeedbackEntries
      }
    });
  } catch (error) {
    console.error("Error fetching candidate interview notes:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Menambahkan catatan interview dan evaluasi baru
 */
export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const candidateListId = Number(req.params.id);
  const { interview_id, note, point, evaluator, user_id } = req.body;

  // Validasi data yang diperlukan
  if (!interview_id || !note) {
    return res.status(400).json({ error: "Interview ID and note are required" });
  }

  try {
    // Tambahkan catatan pada tabel tr_interview_result
    const interviewResult = await db.tr_interview_result.create({
      data: {
        candidate_list_id: candidateListId,
        interview_id: parseInt(interview_id),
        point: point ? parseInt(point) : null,
        note: note,
        interviewer: evaluator || null,
        created_by: user_id ? String(user_id) : null,
        created_at: new Date()
      }
    });

    // Juga catat di log kandidat
    await db.tr_candidate_log.create({
      data: {
        candidate_list_id: candidateListId,
        action: "Interview Feedback",
        result: note,
        status_candidate: null, // Tidak mengubah status
        created_at: new Date(),
        created_by: user_id ? parseInt(user_id) : null
      }
    });

    return res.status(201).json({
      message: "Interview note added successfully",
      data: interviewResult
    });
  } catch (error) {
    console.error("Error adding interview note:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Memperbarui catatan interview yang sudah ada
 */
export const put = async (req: Request, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const resultId = Number(req.params.resultId);
  const { note, point, evaluator, user_id } = req.body;

  if (!note) {
    return res.status(400).json({ error: "Note is required" });
  }

  try {
    // Perbarui catatan pada tabel tr_interview_result
    const updatedResult = await db.tr_interview_result.update({
      where: { id: resultId },
      data: {
        note: note,
        point: point ? parseInt(point) : undefined,
        interviewer: evaluator || undefined,
        updated_at: new Date()
      }
    });

    return res.status(200).json({
      message: "Interview note updated successfully",
      data: updatedResult
    });
  } catch (error) {
    console.error("Error updating interview note:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Menghapus catatan interview
 */
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const resultId = Number(req.params.resultId);

  try {
    // Hapus catatan dari tabel tr_interview_result
    await db.tr_interview_result.delete({
      where: { id: resultId }
    });

    return res.status(200).json({
      message: "Interview note deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting interview note:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};