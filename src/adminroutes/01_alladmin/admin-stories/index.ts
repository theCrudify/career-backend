import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}



// Helper function to save uploaded poster image
const savePosterImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed for poster");
  }

  // Menggunakan path relatif ke folder 'public/upload/PosterStories' di root proyek
  const uploadDir = path.resolve(__dirname, "../../../../public/upload/PosterStories");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `PosterStories${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Poster image saved successfully at:', imagePath);
    return `upload/PosterStories/${filename}`;
  } catch (error) {
    console.error('Error saving poster image:', error);
    return null;
  }
};

// Helper function to save uploaded photo image
const savePhotoImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed for photo");
  }

  // Menggunakan path relatif ke folder 'public/upload/PhotoStories' di root proyek
  const uploadDir = path.resolve(__dirname, "../../../../public/upload/PhotoStories");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `PhotoStories${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Photo image saved successfully at:', imagePath);
    return `upload/PhotoStories/${filename}`;
  } catch (error) {
    console.error('Error saving photo image:', error);
    return null;
  }
};

// Helper function to save uploaded header background image
const saveHeaderImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed for header background");
  }

  const uploadDir = process.env.FILE_DIR
    ? `${process.env.FILE_DIR}/upload/HeaderStories`
    : path.resolve(__dirname, "../../../public/upload/HeaderStories");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `HeaderStories${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Header image saved successfully at:', imagePath);
    return `upload/HeaderStories/${filename}`;
  } catch (error) {
    console.error('Error saving header image:', error);
    return null;
  }
};


// Create a new story with all related data
export const post = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Log the request for debugging
  console.log("Request body:", req.body);
  console.log("Files:", req.files);

  try {
    // Extract basic story data
    const {
      name,
      position,
      nickname,
      tagline_one,
      tagline_two,
      color_code,
      bg_type,
      created_by,
      content_sections // Array of key-value pairs for story content
    } = req.body;

    // Parse content sections if it's a string
    let parsedContentSections = content_sections;
    if (typeof content_sections === 'string') {
      try {
        parsedContentSections = JSON.parse(content_sections);
      } catch (e) {
        return res.status(400).json({ error: "Invalid content_sections format. Must be valid JSON array." });
      }
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Story name is required" });
    }

    if (!position) {
      return res.status(400).json({ error: "Story position is required" });
    }

    // Handle image uploads
    const posterFile = req.files?.poster;
    const photoFile = req.files?.photo;
    const headerBgFile = req.files?.bg_header;

    let posterPath = null;
    let photoPath = null;
    let headerBgPath = null;

    if (posterFile) {
      try {
        posterPath = await savePosterImage(posterFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    if (photoFile) {
      try {
        photoPath = await savePhotoImage(photoFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    if (headerBgFile) {
      try {
        headerBgPath = await saveHeaderImage(headerBgFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Create story in database (main record)
    const newStory = await db.mst_stories.create({
      data: {
        name,
        nickname,
        photo: photoPath,
        poster: posterPath,
        position,
        tagline_one,
        tagline_two,
        color_code,
        bg_header: headerBgPath,
        bg_type: bg_type || "image", // Default to "image"
        created_at: new Date(),
        created_by: created_by || null
      }
    });

    // Create story content sections if provided
    if (parsedContentSections && Array.isArray(parsedContentSections)) {
      for (const section of parsedContentSections) {
        await db.mst_stories_detail.create({
          data: {
            stories_id: String(newStory.id),
            key: section.key,
            value: section.value,
            created_at: new Date()
          }
        });
      }
    }

    return res.status(201).json({
      message: "Story created successfully",
      data: {
        story: newStory,
        contentSections: parsedContentSections
      }
    });
  } catch (error) {
    console.error("Error creating story:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all stories



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

    // Get stories with pagination
    const stories = await db.mst_stories.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Count total stories for pagination
    const totalStories = await db.mst_stories.count({
      where: whereClause
    });

    // Update the picture path to point to the correct location
    const updatedStories = stories.map((story) => ({
      ...story,
      picture: story.photo
        ? `app/public/upload/PosterStories/${path.basename(story.photo)}`
        : null,  // Path updated to point to 'public/upload/banner'
    }));

    return res.status(200).json({
      data: updatedStories,
      pagination: {
        total: totalStories,
        page,
        limit,
        pages: Math.ceil(totalStories / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
