import { Response, Request } from "express";
import { db } from "../../utils/db";
import path from "path";
import fs from "fs";
import moment from "moment";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}


const saveFile = (file: any, folderName: string) => {
  if (!file || !file.data) {
    console.error("File data is missing.");
    return null;
  }

  const uploadDir = path.resolve(__dirname, "../../assets/upload");
  const dir = path.join(uploadDir, folderName);
  

  if (!fs.existsSync(dir)) {
    console.log("Creating directory:", dir);
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

export const post = async (req: CustomRequest, res: Response) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }
  
      console.log("Received Request Data:", req.body);
      console.log("Received Files:", req.files);
  
      const candidateId = Number(req.params.id);
      
      if (!candidateId) {
        return res.status(400).json({ error: "Invalid candidate ID" });
      }
  
      const file = req.files?.["confirm-offering"];
      if (!file) {
        return res.status(400).json({ error: "No valid confirm-offering file was uploaded." });
      }
  
      const filename = saveFile(file, "confirm-offering");
      if (!filename) {
        return res.status(500).json({ error: "File saving failed." });
      }
  
      try {
       
        const updatedCandidate = await db.tr_files.create({
          data: {
            candidate_list_id: candidateId,
            name: "Offering",
            file: `upload/confirm-offering/${filename}`,
            created_at: new Date(), 
          },
        });
  
        console.log("Database update successful:", updatedCandidate);
  
    
        const afterUpdatedCandidate = await db.tr_candidate_list.update({
            where: { id: candidateId }, 
            data: {
              status_candidate: 10, 
            },
          });
  
        return res.status(200).json({
          message: "Confirm offering file uploaded and database updated successfully",
          updatedCandidate,
        });
      } catch (dbError) {
        console.error("Error updating database:", dbError);
        return res.status(500).json({ error: "Database update failed." });
      }
  
    } catch (error) {
      console.error("Unexpected error:", error);
      return res.status(500).json({ error: "An error occurred while processing your request." });
    }
  };
  
