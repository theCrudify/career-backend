// // src/routes/candidates-null-status/update.ts
// import { Response, Request } from "express";
// import { db } from "../../../utils/db";

// export const put = async (req: Request, res: Response) => {
//   if (req.method !== "PUT") {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   try {
//     // Parameter dalam body
//     const { ids, status = 1 } = req.body;

//     // Validasi
//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ error: 'Parameter ids harus berupa array dan tidak boleh kosong' });
//     }

//     // Konversi status ke integer (jika string)
//     const statusValue = typeof status === 'string' ? parseInt(status, 10) : status;

//     // Update kandidat berdasarkan ID
//     const updateResults = await Promise.all(
//       ids.map(async (id) => {
//         const numberID = typeof id === 'string' ? parseInt(id, 10) : id;
//         try {
//           const updatedCandidate = await db.tr_candidate_list.update({
//             where: { id: numberID },
//             data: {
//               status_candidate: statusValue,
//               updated_at: new Date()
//             },
//           });
//           return { id: numberID, success: true, data: updatedCandidate };
//         } catch (err) {
//           console.error(`Error updating candidate with ID ${numberID}:`, err);
//           return { id: numberID, success: false, error: (err as Error).message };
//         }
//       })
//     );

//     // Hitung jumlah berhasil dan gagal
//     const successful = updateResults.filter(r => r.success).length;
//     const failed = updateResults.filter(r => !r.success).length;

//     return res.status(200).json({
//       message: `Updated ${successful} candidate(s) status, ${failed} failed`,
//       results: updateResults
//     });
//   } catch (error) {
//     console.error('Error updating candidates status:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };