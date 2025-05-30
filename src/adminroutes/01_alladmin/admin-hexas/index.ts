import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
    files?: {
        [key: string]: any;
    };
}

// Helper function to save uploaded hexa image
const saveHexaImage = async (file: any) => {
    if (!file || !file.data) {
        return null;
    }

    const fileExtension = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    if (!allowedExtensions.includes(fileExtension)) {
        throw new Error("Only image files are allowed");
    }

    const uploadDir = process.env.FILE_DIR
        ? `${process.env.FILE_DIR}/upload/hexas`
        : path.resolve(__dirname, "../../../public/upload/hexas");

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `Hexa${Date.now()}${fileExtension}`;
    const imagePath = path.join(uploadDir, filename);

    try {
        fs.writeFileSync(imagePath, file.data);
        console.log('Hexa image saved successfully at:', imagePath);
        return `upload/hexas/${filename}`;
    } catch (error) {
        console.error('Error saving hexa image:', error);
        return null;
    }
};

// Get all hexas
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

        // Get hexas with pagination
        const hexas = await db.mst_hexa.findMany({
            where: whereClause,
            orderBy: {
                id: 'asc'
            },
            skip: offset,
            take: limit
        });

        // Count total hexas for pagination
        const totalHexas = await db.mst_hexa.count({
            where: whereClause
        });

        return res.status(200).json({
            data: hexas,
            pagination: {
                total: totalHexas,
                page,
                limit,
                pages: Math.ceil(totalHexas / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching hexas:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Create a new hexa
export const post = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    try {
        console.log("Body masuk:", req.body); // cek isi body

        const { name, description, created_by } = req.body || {};

        if (!name?.trim()) {
            return res.status(400).json({ error: "Hexa name is required" });
        }

        if (!description?.trim()) {
            return res.status(400).json({ error: "Hexa description is required" });
        }

        const newHexa = await db.mst_hexa.create({
            data: {
                name: name.trim(),
                description: description.trim(),
                picture: null,
                created_at: new Date(),
                created_by: created_by
            }
        });

        return res.status(201).json({
            message: "Hexa created successfully",
            data: newHexa
        });

    } catch (error) {
        console.error("Error creating hexa:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

