import express from "express";

// Import job vacancies admin controllers
import { 
  get as getAdminJobVacancies, 
  post as createJobVacancy 
} from "./admin-jobvacancies/index";

import { 
  get as getJobVacancyDetail, 
  put as updateJobVacancy, 
  del as deleteJobVacancy,
  publish as publishJobVacancy,
  unpublish as unpublishJobVacancy
} from "./admin-jobvacancies/[id]";

// Import candidate controllers
import { 
  get as getCandidates, 
  post as updateBulkCandidateStatus,
  getUnread as getUnreadCandidates,
  getStatistics as getCandidateStatistics
} from "./admin-candidate/index";

import { 
  get as getCandidateDetails, 
  updateStatus as updateCandidateStatus,
  scheduleInterview
} from "./admin-candidate/[id]";

import { 
 get as getCandidateNotes,
  post as addCandidateNote,
  put as updateCandidateNote,
  del as deleteCandidateNote
} from "./admin-candidate-notes/[id]";

// Create recruitment router
const recruitmentRouter = express.Router();

// Job Vacancies routes
recruitmentRouter.get("/job-vacancies-byadmin",  getAdminJobVacancies);
recruitmentRouter.post("/job-vacancies-byadmin",  createJobVacancy);
recruitmentRouter.get("/job-vacancies-byadmin/:id",  getJobVacancyDetail);
recruitmentRouter.put("/job-vacancies-byadmin/:id",  updateJobVacancy);
recruitmentRouter.delete("/job-vacancies-byadmin/:id",  deleteJobVacancy);
recruitmentRouter.patch("/job-vacancies-byadmin/:id/publish",  publishJobVacancy);
recruitmentRouter.patch("/job-vacancies-byadmin/:id/unpublish",  unpublishJobVacancy);

// Candidates routes
recruitmentRouter.get("/candidatesbyadmin",  getCandidates);
recruitmentRouter.post("/candidatesbyadmin/bulk-update",  updateBulkCandidateStatus);
recruitmentRouter.get("/candidatesbyadmin/unread",  getUnreadCandidates);
recruitmentRouter.get("/candidatesbyadmin/statistics",  getCandidateStatistics);
recruitmentRouter.get("/candidatesbyadmin/:id",  getCandidateDetails);
recruitmentRouter.put("/candidatesbyadmin/:id/status",  updateCandidateStatus);
recruitmentRouter.post("/candidatesbyadmin/:id/interview",  scheduleInterview);

// Candidate Interview Notes routes
recruitmentRouter.get("/candidatesbyadmin/:id/notes",  getCandidateNotes);
recruitmentRouter.post("/candidatesbyadmin/:id/notes",  addCandidateNote);
recruitmentRouter.put("/candidatesbyadmin/:id/notes/:resultId",  updateCandidateNote);
recruitmentRouter.delete("/candidatesbyadmin/:id/notes/:resultId",  deleteCandidateNote);

export default recruitmentRouter;