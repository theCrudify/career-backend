// src/routes/01_alladmin/admin-banners/index.ts
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

  // Menggunakan path relatif ke folder 'public/upload/profile_banner' di root proyek
  const uploadDir = path.resolve(__dirname, "../../../../public/upload/profile_banner");

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


// Get all banners
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

    // Build where clause
    let whereClause = {};
    if (search) {
      whereClause = {
        name: {
          contains: search,
          mode: "insensitive" // agar pencarian tidak case sensitive
        }
      };
    }

    // Get banners with pagination
    const banners = await db.mst_banner_profile.findMany({
      where: whereClause,
      orderBy: {
        id: 'asc'
      },
      skip: offset,
      take: limit
    });

    // Count total banners for pagination
    const totalBanners = await db.mst_banner_profile.count({
      where: whereClause
    });

    // Update the banner path to point to correct location
    const updatedBanners = banners.map((banner) => ({
      ...banner,
      banner: banner.banner
        ? `app/public/upload/profile_banner/${path.basename(banner.banner)}`
        : null,
    }));

    return res.status(200).json({
      data: updatedBanners,
      pagination: {
        total: totalBanners,
        page,
        limit,
        pages: Math.ceil(totalBanners / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a new banner
export const post = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Handle banner upload
    const bannerFile = req.files?.banner;
    if (!bannerFile) {
      return res.status(400).json({ error: "Banner image is required" });
    }

    let bannerPath;
    try {
      bannerPath = await saveBannerImage(bannerFile);
      if (!bannerPath) {
        return res.status(500).json({ error: "Failed to save banner image" });
      }
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }

    // Create banner in database
    const newBanner = await db.mst_banner_profile.create({
      data: {
        banner: bannerPath
      }
    });

    return res.status(201).json({
      message: "Banner created successfully",
      data: newBanner
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};