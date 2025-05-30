import path from "path";

import cors from "cors";
import express, { json, urlencoded } from "express";
import createRouter, { router } from "express-file-routing";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import { get as getJobs } from "../src/routes/all-vacancies/jobs";
import { get as getDetail } from "../src/routes/all-vacancies/[id]";
import { get as getFiveJobs } from "../src/routes/five-job-new/[id]";
import { get as getCity } from "../src/routes/filter-city/[id]";
import { get as checkEmail } from "../src/routes/check-email/[email]";
import { put as editProfile } from "../src/routes/profile-candidate/edit"
import { postSkills as postSkills } from "../src/routes/skill-candidate/add"
import { put as editSkill } from "../src/routes/skill-candidate/edit"
import { deleteSkill as deleteSkill } from "../src/routes/skill-candidate/delete"
import { get as getSkillById } from "../src/routes/skill-candidate/get"
import { postExperience as postExperience } from "../src/routes/experience-candidate/add";
import { get as getExperienceById } from "../src/routes/experience-candidate/get"
import { deleteExperience as deleteExperience } from "../src/routes/experience-candidate/delete"
import { put as EditExperience } from "../src/routes/experience-candidate/put"
import { postSocialMedia as postSocialMedia } from "./routes/social-media-candidate/add";
import { deleteSocialMedia } from "./routes/social-media-candidate/delete";
import { getSocialMediaById } from "./routes/social-media-candidate/get";
import { put as EditSocialMedia } from "./routes/social-media-candidate/put";
import { post as AddApply } from "./routes/apply-candidate/post"
import { deletedApply } from "./routes/apply-list/delete";
import { get as checkApply } from "./routes/check-candidate-apply/[id]"

// Import controller job vacancies
import { get as getJobVacancies, post as createJobVacancy } from "./routes/job-vancancies/index";
import { get as getJobVacancyDetail, put as updateJobVacancy, del as deleteJobVacancy } from "./routes/job-vancancies/[id]";

//Controller pencarian candidate
import { get as getCandidates } from "./routes/candidates-filter";
import { get as getUnreadCandidates } from "./routes/";
import { get as getCandidateStatistics } from "./routes/candidat-statistic/index";
import { markAsRead, updateStatus, get as getCandidateStatus } from "./routes/candidate-status/[id]";
import { scheduleInterview, getInterviewSchedule } from "./routes/candidate-interview/[id]";
import { get as getCandidatesWithFilter } from "./routes/candidates-filter/index";
import { get as getCandidateDetail } from "./routes/candidate-detail/[id]";

import adminRouter from "./adminroutes";
import recruitmentRouter from "./adminroutes/01_alladmin/job-center/jobroutes";

const main = async () => {
  dotenv.config();

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(fileUpload());

  const router = express.Router();



  var bodyParser = require('body-parser');

  //prod
  // var synologyPATH = process.env.FILE_DIR || "\\192.168.1.122\others\APPS\CROSS"
  // app.use("/app", express.static(path.join(synologyPATH)));

  //local
  var synologyPATH = '';
  app.use(express.static(path.join(__dirname, '/public')));
  app.use('/app', express.static(path.join(synologyPATH)));

  app.use(
    bodyParser.json({
      limit: "50mb",
    })
  );
  app.use(
    bodyParser.urlencoded({
      limit: "50mb",
      extended: true,
      parameterLimit: 50000,
    })
  );

  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });

  await createRouter(router, {
    directory: path.join(__dirname, "routes"),
  });

  app.use("/api", router);
  app.use("/api", adminRouter);
  app.use("/api", recruitmentRouter);





  app.get("/api/jobs", getJobs);
  app.get("/api/detail/:id", getDetail);
  app.get("/api/five-jobs/:id", getFiveJobs);
  app.get("/api/city/:id", getCity);
  app.get("api/check-email/:email", checkEmail);
  app.put("/api/profile-candidate/:id", editProfile);
  app.post("/api/add-skills", postSkills)
  app.put("/api/edit-skill/:id", editSkill)
  app.delete("/api/delete-skill/:id", deleteSkill)
  app.get("/api/get-skill-by-id/:id", getSkillById)
  app.post("/api/add-experiences", postExperience)
  app.get("/api/get-experience-by-id/:id", getExperienceById)
  app.delete("/api/delete-experience/:id", deleteExperience)
  app.put("/api/edit-experience/:id", EditExperience)
  app.post("/api/add-social-media", postSocialMedia)
  app.delete("/api/delete-social-media/:id", deleteSocialMedia)
  app.get("/api/social-media-by-id/:id", getSocialMediaById)
  app.put("/api/edit-social-media/:id", EditSocialMedia)
  app.post("/api/apply-candidate/:id/:num", AddApply)
  app.delete("/api/delete-apply/:id", deletedApply)
  app.get("/api/check-candidate-apply/:id/:candidate", checkApply)


  app.get("/api/job-vacancies", getJobVacancies);
  app.post("/api/job-vacancies", createJobVacancy);
  app.get("/api/job-vacancies/:id", getJobVacancyDetail);
  app.put("/api/job-vacancies/:id", updateJobVacancy);
  app.delete("/api/job-vacancies/:id", deleteJobVacancy);


  app.get("/api/candidates", getCandidates);
  app.get("/api/unread-candidates", getUnreadCandidates);
  app.get("/api/candidate-statistics", getCandidateStatistics);
  app.get("/api/candidate-status/:id", getCandidateStatus);
  app.put("/api/candidate-status/:id/mark-as-read", markAsRead);
  app.put("/api/candidate-status/:id/update", updateStatus);
  app.post("/api/candidate-interview/:id", scheduleInterview);
  app.get("/api/candidate-interview/:id", getInterviewSchedule);
  app.get("/api/candidates-filter", getCandidatesWithFilter);
  app.get("/api/candidate-detail/:id", getCandidateDetail);
  
  
  app.listen(4567, () => {
    console.log("Server started on port 4567");
  });
};

main();
