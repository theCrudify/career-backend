import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

// Helper function to save uploaded banner image
const saveBannerImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed for banner");
  }

  const uploadDir = process.env.FILE_DIR
    ? `${process.env.FILE_DIR}/upload/banner`
    : path.resolve(__dirname, "../../../../public/upload/banner");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `CareerArea${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Banner image saved successfully at:', imagePath);
    return `upload/banner/${filename}`;
  } catch (error) {
    console.error('Error saving banner image:', error);
    return null;
  }
};

// Helper function to save uploaded icon
const saveIconImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed for icon");
  }

  const uploadDir = process.env.FILE_DIR
    ? `${process.env.FILE_DIR}/upload/icon`
    : path.resolve(__dirname, "../../../../public/upload/icon");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `CareerArea${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Icon image saved successfully at:', imagePath);
    return `upload/icon/${filename}`;
  } catch (error) {
    console.error('Error saving icon image:', error);
    return null;
  }
};

// Get career area details by ID
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const careerAreaId = Number(req.params.id);

  try {
    const careerArea = await db.mst_career_area.findUnique({
      where: { id: careerAreaId }
    });

    if (!careerArea) {
      return res.status(404).json({ error: "Career area not found" });
    }

    return res.status(200).json({ data: careerArea });
  } catch (error) {
    console.error("Error fetching career area details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update a career area
export const put = async (req: Request, res: Response): Promise<Response> => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const careerAreaId = Number(req.params.id);

  if (isNaN(careerAreaId)) {
    return res.status(400).json({ error: "Invalid career area ID" });
  }

  try {
    // Cari data career area yang mau diupdate
    const existingCareerArea = await db.mst_career_area.findUnique({
      where: { id: careerAreaId }
    });

    if (!existingCareerArea) {
      return res.status(404).json({ error: "Career area not found" });
    }

    // Extract data dari req.body
    // Pastikan frontend mengirimkan created_by di body saat update
    const {
      department_name,
      header,
      body,
      created_by // ini untuk update created_by
    } = req.body;

    // Handle file upload banner
    const bannerFile = req.files?.banner;
    let bannerPath = existingCareerArea.banner;

    if (bannerFile) {
      try {
        bannerPath = await saveBannerImage(bannerFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Handle file upload icon
    const iconFile = req.files?.icon;
    let iconPath = existingCareerArea.icon;

    if (iconFile) {
      try {
        iconPath = await saveIconImage(iconFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Update data career area di database
    const updatedCareerArea = await db.mst_career_area.update({
      where: { id: careerAreaId },
      data: {
        department_name: department_name || existingCareerArea.department_name,
        banner: bannerPath,
        header: header !== undefined ? header : existingCareerArea.header,
        body: body !== undefined ? body : existingCareerArea.body,
        icon: iconPath,
        created_by: created_by || existingCareerArea.created_by, // overwrite created_by saat update
        created_date: new Date() // update juga tanggal pembuatan
      }
    });

    return res.status(200).json({
      message: "Career area updated successfully",
      data: updatedCareerArea
    });
  } catch (error) {
    console.error("Error updating career area:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a career area
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const careerAreaId = Number(req.params.id);

  try {
    // Check if career area exists
    const existingCareerArea = await db.mst_career_area.findUnique({
      where: { id: careerAreaId }
    });

    if (!existingCareerArea) {
      return res.status(404).json({ error: "Career area not found" });
    }

    // Delete career area
    await db.mst_career_area.delete({
      where: { id: careerAreaId }
    });

    return res.status(200).json({
      message: "Career area deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting career area:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};