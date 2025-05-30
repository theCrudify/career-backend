import { Response, Request } from "express";
import { db } from "../../../utils/db";
import path from "path";
import fs from "fs";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

// Helper function to save uploaded profile picture
const saveProfilePicture = async (file: any) => {
  if (!file || !file.data) {
    return null;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Only image files are allowed for profile picture");
  }

  const uploadDir = process.env.FILE_DIR
    ? `${process.env.FILE_DIR}/upload/profile_pics`
    : path.resolve(__dirname, "../../../../public/upload/profile_pics");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `Profile_${Date.now()}${fileExtension}`;
  const imagePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(imagePath, file.data);
    console.log('Profile picture saved successfully at:', imagePath);
    return `upload/profile_pics/${filename}`;
  } catch (error) {
    console.error('Error saving profile picture:', error);
    return null;
  }
};

// Get authorization by ID
export const get = async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authId = Number(req.params.id);

  try {
    const authorization = await db.mst_authorization.findUnique({
      where: { id: authId }
    });

    if (!authorization) {
      return res.status(404).json({ error: "Authorization not found" });
    }

    // Get company data if exists
    let companyData = null;
    if (authorization.company !== null) {
      companyData = await db.mst_company.findUnique({
        where: { id: authorization.company }
      });
    }

    return res.status(200).json({
      message: "Authorization retrieved successfully",
      data: {
        ...authorization,
        company_data: companyData
      }
    });
  } catch (error) {
    console.error("Error fetching authorization:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update authorization
export const put = async (req: CustomRequest, res: Response) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authId = Number(req.params.id);
  const {
    employee_name,
    employee_code,
    email,
    no_hp,
    site,
    company,
    department,
    role
  } = req.body;

  try {
    // Check if authorization exists
    const existingAuth = await db.mst_authorization.findUnique({
      where: { id: authId }
    });

    if (!existingAuth) {
      return res.status(404).json({ error: "Authorization not found" });
    }

    // Check if employee code is being changed and already exists
    if (employee_code !== existingAuth.employee_code) {
      const duplicateCode = await db.mst_authorization.findFirst({
        where: {
          employee_code,
          id: { not: authId }
        }
      });

      if (duplicateCode) {
        return res.status(409).json({ error: "Employee code already exists" });
      }
    }

    // Handle profile picture upload
    const profilePicFile = req.files?.profile_pic;
    let profilePicPath = existingAuth.profile_pic;

    if (profilePicFile) {
      try {
        profilePicPath = await saveProfilePicture(profilePicFile);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // Update authorization
    const updatedAuth = await db.mst_authorization.update({
      where: { id: authId },
      data: {
        employee_name: employee_name || existingAuth.employee_name,
        employee_code: employee_code || existingAuth.employee_code,
        profile_pic: profilePicPath,
        email: email || existingAuth.email,
        no_hp: no_hp || existingAuth.no_hp,
        site: site || existingAuth.site,
        company: company ? parseInt(company) : existingAuth.company,
        department: department || existingAuth.department,
        role: role || existingAuth.role
      }
    });

    return res.status(200).json({
      message: "Authorization updated successfully",
      data: updatedAuth
    });
  } catch (error) {
    console.error("Error updating authorization:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete authorization
export const del = async (req: Request, res: Response) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authId = Number(req.params.id);

  try {
    // Check if authorization exists
    const existingAuth = await db.mst_authorization.findUnique({
      where: { id: authId }
    });

    if (!existingAuth) {
      return res.status(404).json({ error: "Authorization not found" });
    }

    // Delete authorization
    await db.mst_authorization.delete({
      where: { id: authId }
    });

    return res.status(200).json({
      message: "Authorization deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting authorization:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};