import { Response, Request } from "express";
import { db } from "../../../utils/db";

// Get the video data (should only be one record)
export const get = async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // Get the first video record
        const video = await db.mst_video.findFirst();

        if (!video) {
            return res.status(404).json({ error: "No video data found" });
        }

        return res.status(200).json({ data: video });
    } catch (error) {
        console.error("Error fetching video data:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Update the video data
export const put = async (req: Request, res: Response) => {
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // Extract data from request
        const { name, url } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: "Video name is required" });
        }

        if (!url) {
            return res.status(400).json({ error: "Video URL is required" });
        }

        // Find the first (and should be only) video record
        const existingVideo = await db.mst_video.findFirst();

        let updatedVideo;

        if (existingVideo) {
            // Update the existing record
            updatedVideo = await db.mst_video.update({
                where: { id: existingVideo.id },
                data: {
                    name,
                    url,
                    updated_at: new Date(),
                    updated_by: req.body.updated_by || null
                }
            });
        } else {
            // If no record exists, create a new one
            updatedVideo = await db.mst_video.create({
                data: {
                    name,
                    url,
                    created_at: new Date(),
                    created_by: req.body.created_by || req.body.updated_by || null
                }
            });
        }

        return res.status(200).json({
            message: "Video data updated successfully",
            data: updatedVideo
        });
    } catch (error) {
        console.error("Error updating video data:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};