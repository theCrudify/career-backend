import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

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
    return `/upload/PosterStories/${filename}`;  // Sesuai format yang diinginkan
  } catch (error) {
    console.error('Error saving poster image:', error);
    return null;
  }
};

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
    return `/upload/PhotoStories/${filename}`;  // Sesuai format yang diinginkan
  } catch (error) {
    console.error('Error saving photo image:', error);
    return null;
  }
};

const saveHeaderImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed for header background");
  }

  // Perbaikan path untuk konsistensi - menggunakan struktur path yang sama seperti fungsi lain
  const uploadDir = process.env.FILE_DIR
    ? `${process.env.FILE_DIR}/upload/HeaderStories`
    : path.resolve(__dirname, "../../../../public/upload/HeaderStories");  // Perbaikan struktur path

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `HeaderStories${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Header image saved successfully at:', imagePath);
    return `/upload/HeaderStories/${filename}`;  // Sesuai format yang diinginkan
  } catch (error) {
    console.error('Error saving header image:', error);
    return null;
  }
};


// Get a single story with all its details
// Fungsi bantu untuk menghindari "//" saat gabung URL
function normalizePath(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const storyId = Number(req.params.id);
  const BASE_PATH = "/app/public"; // Base path untuk file upload

  try {
    // Ambil data utama story
    const story = await db.mst_stories.findUnique({
      where: { id: storyId }
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Normalisasi path gambar story jika ada
    const normalizedStory = {
      ...story,
      header_path: story.bg_header ? normalizePath(BASE_PATH, story.bg_header) : null,
      photo_path: story.photo ? normalizePath(BASE_PATH, story.photo) : null
    };

    // Ambil detail section dari story
    const contentSections = await db.mst_stories_detail.findMany({
      where: {
        stories_id: String(storyId)
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Normalisasi path gambar di setiap section
    const normalizedContentSections = contentSections.map(section => ({
      ...section,
      image_path: 'image_path' in section && typeof section.image_path === 'string' && section.image_path ? normalizePath(BASE_PATH, section.image_path) : null
    }));

    // Kembalikan semua data
    return res.status(200).json({
      data: {
        story: normalizedStory,
        contentSections: normalizedContentSections
      }
    });
  } catch (error) {
    console.error("Error fetching story details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update a story and its details
export const put = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const storyId = Number(req.params.id);

  try {
    // Check if the story exists
    const existingStory = await db.mst_stories.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Extract data from request
    const {
      name,
      position,
      nickname,
      tagline_one,
      tagline_two,
      color_code,
      bg_type,
      updated_by,
      content_sections
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

    // Handle image uploads
    const posterFile = req.files?.poster;
    const photoFile = req.files?.photo;
    const headerBgFile = req.files?.bg_header;

    let posterPath = existingStory.poster;
    let photoPath = existingStory.photo;
    let headerBgPath = existingStory.bg_header;

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

    // Update the main story record
    const updatedStory = await db.mst_stories.update({
      where: { id: storyId },
      data: {
        name: name !== undefined ? name : existingStory.name,
        position: position !== undefined ? position : existingStory.position,
        nickname: nickname !== undefined ? nickname : existingStory.nickname,
        photo: photoPath,
        poster: posterPath,
        tagline_one: tagline_one !== undefined ? tagline_one : existingStory.tagline_one,
        tagline_two: tagline_two !== undefined ? tagline_two : existingStory.tagline_two,
        color_code: color_code !== undefined ? color_code : existingStory.color_code,
        bg_header: headerBgPath,
        bg_type: bg_type !== undefined ? bg_type : existingStory.bg_type,
      }
    });

    // Handle content sections if provided
    if (parsedContentSections && Array.isArray(parsedContentSections)) {
      // First approach: Delete all existing sections and create new ones
      // This is simpler but less efficient
      await db.mst_stories_detail.deleteMany({
        where: { stories_id: String(storyId) }
      });

      // Create new sections
      for (const section of parsedContentSections) {
        await db.mst_stories_detail.create({
          data: {
            stories_id: String(storyId),
            key: section.key,
            value: section.value,
            created_at: new Date()
          }
        });
      }
    }

    // Get updated content sections
    const updatedContentSections = await db.mst_stories_detail.findMany({
      where: { stories_id: String(storyId) },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({
      message: "Story updated successfully",
      data: {
        story: updatedStory,
        contentSections: updatedContentSections
      }
    });
  } catch (error) {
    console.error("Error updating story:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a story and all its related data
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const storyId = Number(req.params.id);

  try {
    // Check if the story exists
    const existingStory = await db.mst_stories.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Delete all content sections first (foreign key constraint)
    await db.mst_stories_detail.deleteMany({
      where: { stories_id: String(storyId) }
    });

    // Then delete the main story record
    await db.mst_stories.delete({
      where: { id: storyId }
    });

    return res.status(200).json({
      message: "Story and all related content deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting story:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Special endpoint to add/update/delete content sections separately
export const patchContentSections = async (req: Request, res: Response) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const storyId = Number(req.params.id);

  try {
    // Check if the story exists
    const existingStory = await db.mst_stories.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({ error: "Story not found" });
    }

    const {
      add = [],
      update = [],
      delete: deleteIds = []
    } = req.body;

    // Delete sections
    if (deleteIds.length > 0) {
      await db.mst_stories_detail.deleteMany({
        where: {
          id: { in: deleteIds.map(Number) },
          stories_id: String(storyId)
        }
      });
    }

    // Update existing sections
    for (const section of update) {
      if (!section.id) continue;

      await db.mst_stories_detail.update({
        where: {
          id: Number(section.id)
        },
        data: {
          key: section.key,
          value: section.value
        }
      });
    }

    // Add new sections
    for (const section of add) {
      await db.mst_stories_detail.create({
        data: {
          stories_id: String(storyId),
          key: section.key,
          value: section.value,
          created_at: new Date()
        }
      });
    }

    // Get all updated sections
    const updatedSections = await db.mst_stories_detail.findMany({
      where: { stories_id: String(storyId) },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({
      message: "Content sections updated successfully",
      data: updatedSections
    });
  } catch (error) {
    console.error("Error updating content sections:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};