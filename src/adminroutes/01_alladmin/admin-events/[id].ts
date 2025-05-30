import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";

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

    const uploadDir = process.env.FILE_DIR
        ? `${process.env.FILE_DIR}/upload/banner`
        : path.resolve(__dirname, "../../../../public/upload/banner");

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
        return null;
    }
};

// Get single event details
export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const eventId = Number(req.params.id);

    try {
        const event = await db.mst_event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        return res.status(200).json({
            data: {
                ...event,
                icon_path: event.picture ? `/app/public${event.picture}` : null,
            }
        });
        
    } catch (error) {
        console.error("Error fetching event details:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// Update an existing event
export const put = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const eventId = Number(req.params.id);

    try {
        // Check if event exists
        const existingEvent = await db.mst_event.findUnique({
            where: { id: eventId }
        });

        if (!existingEvent) {
            return res.status(404).json({ error: "Event not found" });
        }

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

        // Handle image upload
        const pictureFile = req.files?.picture;
        let picturePath = existingEvent.picture;

        if (pictureFile) {
            try {
                picturePath = await saveEventImage(pictureFile);
            } catch (error) {
                return res.status(400).json({ error: (error as Error).message });
            }
        }

        // Parse date strings if provided
        const parsedStartDate = start_date ? new Date(start_date) : existingEvent.start_date;
        const parsedEndDate = end_date ? new Date(end_date) : existingEvent.end_date;

        // Update event in database
        const updatedEvent = await db.mst_event.update({
            where: { id: eventId },
            data: {
                name: name || existingEvent.name,
                description: description !== undefined ? description : existingEvent.description,
                location: location !== undefined ? location : existingEvent.location,
                start_date: parsedStartDate,
                end_date: parsedEndDate,
                picture: picturePath,
                hyperlink: hyperlink !== undefined ? hyperlink : existingEvent.hyperlink,
                company: company ? parseInt(company) : existingEvent.company,
                detail: detail !== undefined ? detail : existingEvent.detail,
                is_active: is_active !== undefined ? is_active : existingEvent.is_active,
                updated_at: new Date()
            }
        });

        return res.status(200).json({
            message: "Event updated successfully",
            data: updatedEvent
        });
    } catch (error) {
        console.error("Error updating event:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete an event
export const del = async (req: Request, res: Response) => {
    if (req.method !== "DELETE") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const eventId = Number(req.params.id);

    try {
        // Check if event exists
        const existingEvent = await db.mst_event.findUnique({
            where: { id: eventId }
        });

        if (!existingEvent) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Delete event
        await db.mst_event.delete({
            where: { id: eventId }
        });

        return res.status(200).json({
            message: "Event deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting event:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};