// src/adminroutes/01_alladmin/admin-events/index.ts
import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";
import { formatISO } from "date-fns";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

// Helper function to save uploaded event images
const saveEventImage = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed");
  }

  // Determine upload directory
  const uploadDir = process.env.FILE_DIR
    ? `${process.env.FILE_DIR}/upload/banner`
    : path.resolve(__dirname, "../../../../public/upload/banner");

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `Event${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Event image saved successfully at:', imagePath);
    return `upload/banner/${filename}`;
  } catch (error) {
    console.error('Error saving event image:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    throw new Error(`Failed to save image: ${errorMessage}`);
  }
};

// Get all events (for admin dashboard)
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
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Get events with pagination
    const events = await db.mst_event.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Format dates and ensure all fields are properly populated
    const formattedEvents = events.map(event => ({
      ...event,
      start_date: event.start_date ? formatISO(event.start_date) : null,
      end_date: event.end_date ? formatISO(event.end_date) : null,
      is_active: event.is_active || false,
      picture: event.picture || null,
      description: event.description || "",
      location: event.location || "",
      hyperlink: event.hyperlink || null,
      company: event.company || null,
      detail: event.detail || null
    }));

    // Count total events for pagination
    const totalEvents = await db.mst_event.count({
      where: whereClause
    });

    return res.status(200).json({
      message: "Events retrieved successfully",
      data: formattedEvents,
      pagination: {
        total: totalEvents,
        page,
        limit,
        pages: Math.ceil(totalEvents / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({ error: "Internal Server Error", message: errorMessage });
  }
};

// Create a new event
export const post = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract data from request
    const {
      name,
      description,
      location,
      start_date,
      end_date,
      hyperlink,
      company,
      detail,
      is_active
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Event name is required", message: "Event name is required" });
    }

    if (!description) {
      return res.status(400).json({ error: "Event description is required", message: "Event description is required" });
    }

    // Handle image upload
    const pictureFile = req.files?.picture;
    let picturePath = null;

    if (pictureFile) {
      try {
        picturePath = await saveEventImage(pictureFile);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return res.status(400).json({ error: errorMessage, message: errorMessage });
      }
    }

    // Parse date strings if provided
    const parsedStartDate = start_date ? new Date(start_date) : null;
    const parsedEndDate = end_date ? new Date(end_date) : null;
    
    // Parse is_active to ensure it's a boolean
    const isActive = is_active === 'true' || is_active === true;

    // Create event in database
    const newEvent = await db.mst_event.create({
      data: {
        name,
        description,
        location: location || "",
        start_date: parsedStartDate,
        end_date: parsedEndDate,
        picture: picturePath,
        hyperlink: hyperlink || null,
        company: company ? parseInt(company) : null,
        detail: detail || null,
        is_active: isActive ? "true" : "false",
        created_at: new Date(),
        created_by: req.body.created_by || "admin"
      }
    });

    return res.status(201).json({
      message: "Event created successfully",
      data: newEvent
    });
  } catch (error) {
    console.error("Error creating event:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({ error: "Internal Server Error", message: errorMessage });
  }
};