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

// Get single hexa details
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const hexaId = Number(req.params.id);

  try {
    const hexa = await db.mst_hexa.findUnique({
      where: { id: hexaId }
    });

    if (!hexa) {
      return res.status(404).json({ error: "Hexa not found" });
    }

    return res.status(200).json({ data: hexa });
  } catch (error) {
    console.error("Error fetching hexa details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update an existing hexa
export const put = async (req: Request, res: Response): Promise<Response> => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const hexaId = Number(req.params.id);

  try {
    // Cek apakah data hexa ada
    const existingHexa = await db.mst_hexa.findUnique({
      where: { id: hexaId }
    });

    if (!existingHexa) {
      return res.status(404).json({ error: "Hexa not found" });
    }

    // Ambil data dari request body
    const {
      name,
      description,
      created_by,
      updated_by
    } = req.body;

    // Handle file upload (misal pakai middleware multer, dll)
    const pictureFile = req.files?.picture;
    let picturePath = existingHexa.picture;

    if (pictureFile) {
      try {
        picturePath = await saveHexaImage(pictureFile);  // fungsi simpan file sesuai implementasi kamu
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Update data di database, termasuk created_by yang bisa diubah, dan updated_by + updated_at
    const updatedHexa = await db.mst_hexa.update({
      where: { id: hexaId },
      data: {
        name: name ?? existingHexa.name,
        description: description ?? existingHexa.description,
        picture: picturePath,
        created_by: created_by ?? existingHexa.created_by, // update created_by jika ada, kalau tidak tetap pakai lama
      }
    });

    return res.status(200).json({
      message: "Hexa updated successfully",
      data: updatedHexa
    });
  } catch (error) {
    console.error("Error updating hexa:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a hexa
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const hexaId = Number(req.params.id);

  try {
    // Check if hexa exists
    const existingHexa = await db.mst_hexa.findUnique({
      where: { id: hexaId }
    });

    if (!existingHexa) {
      return res.status(404).json({ error: "Hexa not found" });
    }

    // Delete hexa
    await db.mst_hexa.delete({
      where: { id: hexaId }
    });

    return res.status(200).json({
      message: "Hexa deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting hexa:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};