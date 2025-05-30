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



// Create a new benefit
export const post = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Request body:", req.body);
  console.log("Files:", req.files);

  try {
    const { name, description, created_by } = req.body;

    // Validasi field wajib
    if (!name) {
      return res.status(400).json({ error: "Benefit name is required" });
    }

    if (!description) {
      return res.status(400).json({ error: "Benefit description is required" });
    }

    if (!created_by) {
      return res.status(400).json({ error: "Creator NIK (created_by) is required" });
    }

    // Handle upload gambar
    const pictureFile = req.files?.picture;
    let picturePath = null;

    if (pictureFile) {
      try {
        picturePath = await saveBenefitImage(pictureFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Simpan ke database
    const newBenefit = await db.mst_benefit.create({
      data: {
        name,
        description,
        picture: picturePath,
        created_at: new Date(),
        created_by
      }
    });

    return res.status(201).json({
      message: "Benefit created successfully",
      data: newBenefit
    });
  } catch (error) {
    console.error("Error creating benefit:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get search parameter
    const search = req.query.search as string;

    // Build query based on search
    let whereClause = {};
    if (search) {
      whereClause = {
        name: {
          contains: search
        }
      };
    }

    // Get benefits with pagination
    const benefits = await db.mst_benefit.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Count total benefits for pagination
    const totalBenefits = await db.mst_benefit.count({
      where: whereClause
    });

    // Update the picture path to point to the correct location
    const updatedBenefits = benefits.map((benefit) => ({
      ...benefit,
      picture: benefit.picture
        ? `app/public/upload/icon/${path.basename(benefit.picture)}`
        : null,  // Path updated to point to 'public/upload/banner'
    }));

    return res.status(200).json({
      data: updatedBenefits,
      pagination: {
        total: totalBenefits,
        page,
        limit,
        pages: Math.ceil(totalBenefits / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching benefits:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
