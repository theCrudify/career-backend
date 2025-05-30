// src/routes/01_alladmin/admin-banners/[id].ts
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
    ? `${process.env.FILE_DIR}/upload/profile_banner`
    : path.resolve(__dirname, "../../../public/upload/profile_banner");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `ProfileBanner${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Banner image saved successfully at:', imagePath);
    return `upload/profile_banner/${filename}`;
  } catch (error) {
    console.error('Error saving banner image:', error);
    return null;
  }
};

// Get a single banner
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const banners = await db.mst_banner_profile.findMany({
      orderBy: { id: 'asc' }
    });

    const normalizedBanners = banners.map(banner => {
      let bannerPath = banner.banner;
      if (bannerPath && bannerPath.startsWith('http')) {
        try {
          const url = new URL(bannerPath);
          bannerPath = url.pathname;
        } catch (e) {
          console.warn('Failed to parse URL:', bannerPath);
        }
      }

      return {
        ...banner,
        banner: bannerPath
      };
    });

    return res.status(200).json({
      message: "Banners retrieved successfully",
      data: normalizedBanners
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Update a banner
export const put = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const bannerId = Number(req.params.id);

  try {
    // Check if banner exists
    const existingBanner = await db.mst_banner_profile.findUnique({
      where: { id: bannerId }
    });

    if (!existingBanner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    // Handle banner upload
    const bannerFile = req.files?.banner;
    let bannerPath = existingBanner.banner;

    if (bannerFile) {
      try {
        bannerPath = await saveBannerImage(bannerFile);
        if (!bannerPath) {
          return res.status(500).json({ error: "Failed to save banner image" });
        }
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Update banner in database
    const updatedBanner = await db.mst_banner_profile.update({
      where: { id: bannerId },
      data: {
        banner: bannerPath
      }
    });

    return res.status(200).json({
      message: "Banner updated successfully",
      data: updatedBanner
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a banner
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const bannerId = Number(req.params.id);

  try {
    // Check if banner exists
    const existingBanner = await db.mst_banner_profile.findUnique({
      where: { id: bannerId }
    });

    if (!existingBanner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    // Delete banner from database
    await db.mst_banner_profile.delete({
      where: { id: bannerId }
    });

    // Optionally, you could also delete the image file from storage here
    // But we're keeping it to avoid issues if other records reference the same file

    return res.status(200).json({
      message: "Banner deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};