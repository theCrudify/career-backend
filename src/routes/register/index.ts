import { Response, Request } from "express";
import { db } from "../../utils/db";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { sendEmailNotification } from "../../template/EmailController";
import { candidateRegisterEmail } from "../../template/email";

interface CustomRequest extends Request {
  files?: {
    [key: string]: any;
  };
}

export const post = async (req: CustomRequest, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("Received Request Data:", req.body);
  console.log("Received Files:", req.files);

  const {
    full_name,
    phone_number,
    no_ktp,
    email,
    password,
    birth_date,
    gender,
    marital_status,
    religion,
    domicile_province,
    domicile_city,
    domicile_address,
    is_sim_a,
    is_manual_car,
    education,
    institution,
    major,
    year_of_graduation,
    score,
    expected_salary,
    city,
    is_fresh_graduate,
    experience,
    skills,
    social_media,
    source,
    vacancy_information,
    is_agree,
    is_abroad,
  } = req.body;

  const sim_a = parseInt(req.body.is_sim_a, 10);
  const manual_car = parseInt(req.body.is_manual_car, 10);
  const fresh_graduate = parseInt(req.body.is_fresh_graduate, 10);
  const agree = req.body.is_agree ? parseInt(req.body.is_agree, 10) : 0;
  const consent = req.body.is_consent ? parseInt(req.body.is_consent, 10) : 0;
  const abroad = parseInt(req.body.is_abroad, 10);
  const parsedExperience = experience ? JSON.parse(experience) : [];
  const parsedSkills = skills ? JSON.parse(skills) : [];
  const parsedSocialMedia = social_media ? JSON.parse(social_media) : [];

  try {
    const hashedPassword = crypto
      .createHash("md5")
      .update(password)
      .digest("hex");

    const fileFoto = req.files?.file_foto;
    const cvFile = req.files?.cv;

    let fotoFilename = "";
    let cvFilename = "";

    if (fileFoto) {
      const fotoExtension = path.extname(fileFoto.name).toLowerCase();
      const allowedFotoExtensions = [".jpg", ".jpeg", ".png"];

      if (!allowedFotoExtensions.includes(fotoExtension)) {
        return res.status(400).json({ message: "file foto wrong" });
      }
    }

    if (cvFile) {
      const cvExtension = path.extname(cvFile.name).toLowerCase();
      const allowedCvExtensions = [".pdf"];

      if (!allowedCvExtensions.includes(cvExtension)) {
        return res.status(400).json({ message: "file cv wrong" });
      }
    }

    // const uploadDir = process.env.FILE_DIR + '/upload';
    // const uploadDir = path.resolve(__dirname, "../../../public/upload");
    const uploadDir = process.env.FILE_DIR ? `${process.env.FILE_DIR}/upload` : path.resolve(__dirname, "../../../public/upload");
    const candidateDir = path.join(uploadDir, "candidate");
    const cvDir = path.join(uploadDir, "cv");

    if (!fs.existsSync(candidateDir)) {
      fs.mkdirSync(candidateDir, { recursive: true });
    }

    if (!fs.existsSync(cvDir)) {
      fs.mkdirSync(cvDir, { recursive: true });
    }

    try {
      if (fileFoto && fileFoto.data) {
        const fotoExtension = path.extname(fileFoto.name);
        fotoFilename = `fotoCandidate_${Date.now()}${fotoExtension}`;
        const fotoPath = path.join(candidateDir, fotoFilename);
    
        fs.writeFileSync(fotoPath, fileFoto.data);
        console.log('Foto saved successfully at:', fotoPath);
      }
    } catch (error) {
      console.error('Error saving foto:', error);
      return res.status(500).json({ error: 'Failed to save the photo.' });
    }

    try {
      if (cvFile && cvFile.data) {
        const cvExtension = path.extname(cvFile.name);
        cvFilename = `cvCandidate_${Date.now()}${cvExtension}`;
        const cvPath = path.join(cvDir, cvFilename);
      
        fs.writeFileSync(cvPath, cvFile.data);
        console.log('CV saved successfully at:', cvPath);
      }
    } catch (error) {
      console.error('Error saving CV:', error);
      return res.status(500).json({ error: 'Failed to save the CV.' });
    }

    const currentTimestamp = new Date().toISOString();

    const newCandidate = await db.tr_candidate_reg.create({
      data: {
        full_name: full_name,
        phone_number: phone_number,
        no_ktp: no_ktp,
        email: email,
        password: hashedPassword,
        birth_date: new Date(birth_date),
        gender: gender,
        marital_status: marital_status,
        religion: religion,
        domicile_province: domicile_province,
        domicile_city: domicile_city,
        domicile_address: domicile_address,
        is_sim_a: sim_a,
        is_manual_car: manual_car,
        file_foto: fotoFilename ? `upload/candidate/${fotoFilename}` : null,
education: education ? parseInt(education, 10) : null,
        institution: institution,
        major: major,
        year_of_graduation: year_of_graduation,
        score: score,
        expected_salary: expected_salary,
        city: city,
        is_fresh_graduate: is_fresh_graduate,
        source: source,
        vacancy_information: vacancy_information,
        cv: cvFilename ? `upload/cv/${cvFilename}` : null,
        is_agree: agree,
        is_consent: consent,
        created_at: currentTimestamp,
        is_abroad: abroad,
        status: "notActive"
      },
    });

    if (parsedExperience && parsedExperience.length > 0) {
      for (const exp of parsedExperience) {
        await db.tr_experience_candidate.create({
          data: {
            id_candidate: newCandidate.id,
            experience_company: exp.company,
            experience_position: exp.position,
            experience_salary: exp.salary,
            experience_start_date: new Date(exp.start_date),
            experience_end_date: exp.end_date ? new Date(exp.end_date) : null,
            experience_job_level: String(exp.job_level),
            experience_description: exp.description,
            is_currently_working: String(exp.is_currently_working),
          },
        });
      }
    }

    if (parsedSkills && parsedSkills.length > 0) {
      for (const skill of parsedSkills) {
        await db.tr_skill_candidate.create({
          data: {
            id_candidate: newCandidate.id,
            skill: skill.skill,
            skill_rate: skill.skill_rate,
          },
        });
      }
    }

    if (parsedSocialMedia && parsedSocialMedia.length > 0) {
      for (const social of parsedSocialMedia) {
        await db.tr_social_media.create({
          data: {
            candidate_id: newCandidate.id,
            platform: social.platform,
            account: social.account,
          },
        });
      }
    }

    const emailContent = candidateRegisterEmail({
      full_name: full_name,
      id: newCandidate.id,
    });

   
    const emailData = {
      subject: "Verify Account",
      to: email,
      text: "",
      body: emailContent,
    };

    
    const emailSent = await sendEmailNotification(emailData);

    if (!emailSent) {
      console.error("Failed to send verification email.");
      return res.status(500).json({ error: "Failed to send verification email." });
    }

    return res
      .status(200)
      .json({ message: "Candidate data has been successfully saved." });
  } catch (error) {
    console.error("Error saving candidate data:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};
