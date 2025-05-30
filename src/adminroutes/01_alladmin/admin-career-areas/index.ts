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

// Get all career areas
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
        department_name: {
          contains: search
        }
      };
    }

    // Get career areas with pagination
    const careerAreas = await db.mst_career_area.findMany({
      where: whereClause,
      orderBy: {
        created_date: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Count total career areas for pagination
    const totalCareerAreas = await db.mst_career_area.count({
      where: whereClause
    });

    return res.status(200).json({
      data: careerAreas,
      pagination: {
        total: totalCareerAreas,
        page,
        limit,
        pages: Math.ceil(totalCareerAreas / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching career areas:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a new career area
export const post = async (
  req: Request,
  res: Response
): Promise<Response<any, Record<string, any>>> => {
  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract data from request
    const {
      department_name,
      header,
      body,
      created_by
    } = req.body;

    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);

    // Validate required fields
    if (!department_name) {
      console.warn("Validation failed: department_name is missing");
      return res.status(400).json({ error: "Department name is required" });
    }

    // Handle banner upload
    const bannerFile = req.files?.banner;
    let bannerPath = null;

    if (bannerFile) {
      console.log("Uploading banner...");
      try {
        bannerPath = await saveBannerImage(bannerFile);
        console.log("Banner uploaded to:", bannerPath);
      } catch (error) {
        console.error("Banner upload failed:", error);
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Handle icon upload
    const iconFile = req.files?.icon;
    let iconPath = null;

    if (iconFile) {
      console.log("Uploading icon...");
      try {
        iconPath = await saveIconImage(iconFile);
        console.log("Icon uploaded to:", iconPath);
      } catch (error) {
        console.error("Icon upload failed:", error);
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Create career area in database
    const newCareerArea = await db.mst_career_area.create({
      data: {
        department_name,
        banner: bannerPath,
        header,
        body,
        icon: iconPath,
        created_date: new Date(),
        created_by: created_by || null
      }
    });

    console.log("Career area successfully created:", newCareerArea);

    return res.status(201).json({
      message: "Career area created successfully",
      data: newCareerArea
    });
  } catch (error) {
    console.error("Error creating career area:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
