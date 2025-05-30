import { Response, Request } from "express";
import { db } from "../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

export const put = async (req: CustomRequest, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const fileFoto = req.files?.file_foto || req.files?.file;
    let fotoFilename = "";

    const allowedImageExtensions = [".jpg", ".jpeg", ".png"];
    const fileExtensionCheck = fileFoto.name.slice(((fileFoto.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
    
    if (!allowedImageExtensions.includes(`.${fileExtensionCheck}`)) {
      return res.status(400).json({ message: "File must image" })
    }
    

    // const uploadDir = path.resolve(__dirname, "../../../public/upload");
    const uploadDir = process.env.FILE_DIR ? `${process.env.FILE_DIR}/upload` : path.resolve(__dirname, "../../../public/upload");
    const candidateDir = path.join(uploadDir, "candidate");
    const candidateId = Number(req.params.id);

    if (!fs.existsSync(candidateDir)) {
      fs.mkdirSync(candidateDir, { recursive: true });
    }

    if (fileFoto && fileFoto.data) {
      const fotoExtension = path.extname(fileFoto.name);
      fotoFilename = `fotoCandidate_${Date.now()}${fotoExtension}`;
      const fotoPath = path.join(candidateDir, fotoFilename);

      fs.writeFileSync(fotoPath, fileFoto.data);
    } else {
      console.error("File data is missing or file is not uploaded properly.");
    }

    if (fotoFilename !== "") {
      const updatedCandidate = await db.tr_candidate_reg.update({
        where: { id: candidateId },
        data: {
          file_foto: `upload/candidate/${fotoFilename}`,
        },
      });

      return res.status(200).json({ message: "Foto profile updated successfully", updatedCandidate });
    } else {
      return res.status(400).json({ error: "No valid file was uploaded." });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "An error occurred while processing your request." });
  }
};
