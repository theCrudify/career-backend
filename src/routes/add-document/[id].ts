import { Response, Request } from "express";
import { db } from "../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

const saveFile = (file: any, folderName: string) => {
  if (!file || !file.data) return null;
  
  const fileExtensionCheck = path.extname(file.name).toLowerCase();
  
  if (fileExtensionCheck !== ".pdf") {
    throw new Error("File must be a PDF");
  }

  const uploadDir = path.resolve(__dirname, "../../../public/upload");
  const dir = path.join(uploadDir, folderName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileExtension = path.extname(file.name);
  const filename = `${folderName}_${Date.now()}${fileExtension}`;
  const filePath = path.join(dir, filename);

  try {
    fs.writeFileSync(filePath, file.data);
    console.log(`${folderName} saved successfully at:`, filePath);
    return filename;
  } catch (error) {
    console.error(`Error saving ${folderName}:`, error);
    return null;
  }
};

export const put = async (req: CustomRequest, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Received Request Data:", req.body);
  console.log("Received Files:", req.files);

  try {
    const candidateId = Number(req.params.id);
    const fields = [
      { key: "cv", folder: "cv" },
      { key: "file_ktp", folder: "ktp" },
      { key: "file_kk", folder: "kk" },
      { key: "file_npwp", folder: "npwp" },
      { key: "file_rekening", folder: "rekening" },
      { key: "file_bpjs_kerja", folder: "bpjs_kerja" },
      { key: "file_bpjs_sehat", folder: "bpjs_sehat" },
      { key: "file_transkrip", folder: "transkip" },
      { key: "file_sim_a", folder: "sim_a" },
      { key: "file_sim_c", folder: "sim_c" },
      { key: "file_ijazah", folder: "ijazah" },
      { key: "file_foto_formal", folder: "foto_formal" },  
      { key: "file_skck", folder: "skck" },  
    ];

    const updates: any = {};

    for (const field of fields) {
      const file = req.files?.[field.key];
      if (file) {
        try {
          const filename = saveFile(file, field.folder);
          if (filename) {
            updates[field.key] = `upload/${field.folder}/${filename}`;
          }
        } catch (error) {
          console.log("ini errorr: ",error);
          
          return res.status(400).json({ message: "pdf only" });  
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const updatedCandidate = await db.tr_candidate_reg.update({
        where: { id: candidateId },
        data: updates,
      });

      console.log("Database update successful:", updatedCandidate);
      return res.status(200).json({
        message: "Documents updated successfully",
        updatedCandidate,
      });
    } else {
      return res.status(400).json({ error: "No valid files were uploaded." });
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};
