// // File: src/routes/admin/bulk-status-update.ts
// import { Response, Request } from "express";
// import { db } from "../../../utils/db";

// // Update status for multiple candidates at once
// export const post = async (req: Request, res: Response) => {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const { candidate_ids, status, notes, updated_by } = req.body;

//   try {
//     // Validate required fields
//     if (!candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
//       return res.status(400).json({ error: "Candidate IDs array is required" });
//     }

//     if (!status) {
//       return res.status(400).json({ error: "Status is required" });
//     }

//     // Update all candidates
//     const updateResults = await Promise.all(
//       candidate_ids.map(async (id) => {
//         try {
//           // Update candidate status
//           await db.tr_candidate_list.update({
//             where: { id: parseInt(id) },
//             data: {
//               status_candidate: parseInt(status),
//               updated_at: new Date()
//             }
//           });

//           // Log the status change
//           await db.tr_candidate_log.create({
//             data: {
//               candidate_list_id: parseInt(id),
//               action: `Status updated to ${status} (bulk update)`,
//               result: notes || "",
//               status_candidate: status.toString(),
//               created_at: new Date(),
//               created_by: updated_by ? parseInt(updated_by) : null
//             }
//           });

//           return { id, success: true };
//         } catch (error) {
//           console.error(`Error updating candidate ${id}:`, error);
//           return { id, success: false, error: (error as Error).message };
//         }
//       })
//     );

//     const successful = updateResults.filter((r) => r.success).length;
//     const failed = updateResults.filter((r) => !r.success).length;

//     return res.status(200).json({
//       message: `Successfully updated ${successful} candidates, ${failed} failed`,
//       results: updateResults
//     });
//   } catch (error) {
//     console.error("Error in bulk status update:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };


