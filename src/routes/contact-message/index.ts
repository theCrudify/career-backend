import { Response, Request } from "express";
import { db } from "../../utils/db";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs";

interface ContactMessageForm {
  full_name: string;
  email: string;
  no_hp: string;
  message: string;
}
interface ContactFile {
  attachment: UploadedFile | null;
}

export const post = async (req: Request, res: Response) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const contactMessageValue: ContactMessageForm = {
    full_name: req.body.full_name,
    email: req.body.email,
    no_hp: req.body.no_hp,
    message: req.body.message,
  };
  const file_upload: ContactFile = {
    attachment: (req.files?.attachment as UploadedFile) || null,
  };

  const uploadDir = path.resolve(__dirname, "../../../public/upload");
  const contactFileDir = path.join(uploadDir, "contact");

  if (!fs.existsSync(contactFileDir)) {
    fs.mkdirSync(contactFileDir, { recursive: true });
  }

	let attachmentName: string = "";
  try {
    if (file_upload && file_upload.attachment) {
      const attachmentExtension = path.extname(file_upload.attachment.name);
      attachmentName = `attachment_${Date.now()}${attachmentExtension}`;
      const attachmentPath = path.join(contactFileDir, attachmentName);
      fs.writeFileSync(attachmentPath, file_upload.attachment.data);
    }
  } catch (error) {
    console.error("Error saving file:", error);
    return res.status(500).json({ error: "Failed to save the file." });
  }

  try {
    const newMessage = await db.tr_contact.create({
      data: {
        full_name: contactMessageValue.full_name,
        email: contactMessageValue.email,
        no_hp: contactMessageValue.no_hp,
        message: contactMessageValue.message,
				attachment: attachmentName ? `upload/contact/${attachmentName}` : null
      },
    });

    if (newMessage === null) {
      return res.status(200).json({ message: "Record not found" });
    } else {
      return res.status(201).json(newMessage);
    }
  } catch (error) {
    console.error("ini error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
