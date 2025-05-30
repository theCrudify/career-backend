import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

// Helper function to save uploaded benefit icon
const saveBenefitImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed");
  }

  // Menggunakan path relatif ke folder 'public/upload/icon' di root proyek
  const uploadDir = path.resolve(__dirname, "../../../../public/upload/icon");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `Benefit${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Benefit image saved successfully at:', imagePath);
    return `upload/icon/${filename}`;
  } catch (error) {
    console.error('Error saving benefit image:', error);
    return null;
  }
};

// Get single benefit details
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const benefitId = Number(req.params.id);

  try {
    const benefit = await db.mst_benefit.findUnique({
      where: { id: benefitId }
    });

    if (!benefit) {
      return res.status(404).json({ error: "Benefit not found" });
    }

    // Buat full URL agar gambar bisa diakses dari frontend
    const pictureUrl = benefit.picture
    ? benefit.picture.startsWith('http')
      ? benefit.picture
      : `app/public/${benefit.picture.replace(/^\/+/, '')}`
    : null;
  
    return res.status(200).json({
      data: {
        ...benefit,
        picture: pictureUrl
      }
    });
  } catch (error) {
    console.error("Error fetching benefit details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update an existing benefit
export const put = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const benefitId = Number(req.params.id);

  try {
    // Check if benefit exists
    const existingBenefit = await db.mst_benefit.findUnique({
      where: { id: benefitId }
    });

    if (!existingBenefit) {
      return res.status(404).json({ error: "Benefit not found" });
    }

    // Extract data from request
    const {
      name,
      description,
      created_by  // <- ini tetap pakai created_by karena kolom updated_by tidak ada
    } = req.body;

    // Validasi created_by wajib
    if (!created_by) {
      return res.status(400).json({ error: "Updater NIK (created_by) is required" });
    }

    // Handle image upload
    const pictureFile = req.files?.picture;
    let picturePath = existingBenefit.picture;

    if (pictureFile) {
      try {
        picturePath = await saveBenefitImage(pictureFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Update benefit
    const updatedBenefit = await db.mst_benefit.update({
      where: { id: benefitId },
      data: {
        name: name || existingBenefit.name,
        description: description !== undefined ? description : existingBenefit.description,
        picture: picturePath,
        created_by: created_by, // ← ini akan di-update sesuai user terbaru
        created_at: new Date()  // optional: reset waktu update kalau memang ini sebagai updated_at juga
      }
    });

    return res.status(200).json({
      message: "Benefit updated successfully",
      data: updatedBenefit
    });
  } catch (error) {
    console.error("Error updating benefit:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Delete a benefit
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const benefitId = Number(req.params.id);

  try {
    // Check if benefit exists
    const existingBenefit = await db.mst_benefit.findUnique({
      where: { id: benefitId }
    });

    if (!existingBenefit) {
      return res.status(404).json({ error: "Benefit not found" });
    }

    // Delete benefit
    await db.mst_benefit.delete({
      where: { id: benefitId }
    });

    return res.status(200).json({
      message: "Benefit deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting benefit:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};