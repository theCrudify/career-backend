// adminroutes.ts (versi update)
import express from "express";

// Import the new event admin controllers
import { get as getAdminEvents } from "./adminroutes/01_alladmin/admin-events/index";
import { post as createEvent } from "./adminroutes/01_alladmin/admin-events/index";
import { get as getEventById } from "./adminroutes/01_alladmin/admin-events/[id]";
import { put as updateEvent } from "./adminroutes/01_alladmin/admin-events/[id]";
import { del as deleteEvent } from "./adminroutes/01_alladmin/admin-events/[id]";

// Import the career area admin controllers
import { get as getAdminCareerAreas } from "./adminroutes/01_alladmin/admin-career-areas/index";
import { post as createCareerArea } from "./adminroutes/01_alladmin/admin-career-areas/index";
import { get as getCareerAreaById } from "./adminroutes/01_alladmin/admin-career-areas/[id]";
import { put as updateCareerArea } from "./adminroutes/01_alladmin/admin-career-areas/[id]";
import { del as deleteCareerArea } from "./adminroutes/01_alladmin/admin-career-areas/[id]";

// Import the hexas admin controllers
import { get as getAdminHexas } from "./adminroutes/01_alladmin/admin-hexas/index";
import { post as createHexa } from "./adminroutes/01_alladmin/admin-hexas/index";
import { get as getHexaById } from "./adminroutes/01_alladmin/admin-hexas/[id]";
import { put as updateHexa } from "./adminroutes/01_alladmin/admin-hexas/[id]";
import { del as deleteHexa } from "./adminroutes/01_alladmin/admin-hexas/[id]";

// Import the benefits admin controllers
import { get as getAdminBenefits } from "./adminroutes/01_alladmin/admin-benefits/index";
import { post as createBenefit } from "./adminroutes/01_alladmin/admin-benefits/index";
import { get as getBenefitById } from "./adminroutes/01_alladmin/admin-benefits/[id]";
import { put as updateBenefit } from "./adminroutes/01_alladmin/admin-benefits/[id]";
import { del as deleteBenefit } from "./adminroutes/01_alladmin/admin-benefits/[id]";

// Import the stories admin controllers
import { get as getAdminStories } from "./adminroutes/01_alladmin/admin-stories/index";
import { post as createStory } from "./adminroutes/01_alladmin/admin-stories/index";
import { get as getStoryById } from "./adminroutes/01_alladmin/admin-stories/[id]";
import { put as updateStory } from "./adminroutes/01_alladmin/admin-stories/[id]";
import { del as deleteStory } from "./adminroutes/01_alladmin/admin-stories/[id]";
import { patchContentSections } from "./adminroutes/01_alladmin/admin-stories/[id]";

// Import the video admin controllers
import { get as getAdminVideo } from "./adminroutes/01_alladmin/admin-video/index";
import { put as updateVideo } from "./adminroutes/01_alladmin/admin-video/index";

// Import the candidates admin controllers
// import { get as getNullStatusCandidates } from "./adminroutes/01_alladmin/admin-candidates-reg/index";
import { createUsersFromEmployment } from "./adminroutes/02_alladmin/admin-setup-user";
import { loginuserRISE } from "./adminroutes/02_alladmin/admin-setup-user/login";
// import { post as updateBulkCandidateStatus } from "./adminroutes/01_alladmin/admin-candidate/index";
// import { get as getCandidateDetails, updateStatus } from "./adminroutes/01_alladmin/admin-candidate/[id]";

// Import banner controllers
import { get as getAdminBanners, post as createBanner } from "./adminroutes/01_alladmin/admin-banner/index";
import { get as getBannerById, put as updateBanner, del as deleteBanner } from "./adminroutes/01_alladmin/admin-banner/[id]";

// Import company controllers
import { get as getCompanies, post as createCompany } from "./adminroutes/01_alladmin/admin-companies/index";
import { get as getCompanyById, put as updateCompany, del as deleteCompany } from "./adminroutes/01_alladmin/admin-companies/[id]";

// Import department controllers
import { get as getDepartments, post as createDepartment } from "./adminroutes/01_alladmin/admin-departments/index";
import { get as getDepartmentById, put as updateDepartment, del as deleteDepartment, deactivate as deactivateDepartment } from "./adminroutes/01_alladmin/admin-departments/[id]";

// Import site controllers
import { get as getSites, post as createSite } from "./adminroutes/01_alladmin/admin-sites/index";
import { get as getSiteById, put as updateSite, del as deleteSite } from "./adminroutes/01_alladmin/admin-sites/[id]";

// Import level controllers
import { get as getLevels, post as createLevel } from "./adminroutes/01_alladmin/admin-level/index";
import { get as getLevelById, put as updateLevel, del as deleteLevel, deactivate as deactivateLevel } from "./adminroutes/01_alladmin/admin-level/[id]";

// Import job vacancies admin controllers
// import { get as getAdminJobVacancies } from "./adminroutes/01_alladmin/admin-jobvacancies/index";
// import { get as getAdminJobVacancyCandidates } from "./adminroutes/01_alladmin/admin-jobvacancies/[id]";

// // Import candidate statistics
// import { get as getCandidateStatistics } from "./routes/candidat-statistic/index";

// // Import candidates filter
// import { get as getCandidatesWithFilter } from "./routes/candidates-filter/index";
// import { get as getCandidateDetail } from "./routes/candidate-detail/[id]";

// Import routes yang baru
// Import authorization controllers
import { get as getAuthorizations, post as createAuthorization } from "./adminroutes/01_alladmin/admin-authorization/index";
import { get as getAuthorizationById, put as updateAuthorization, del as deleteAuthorization } from "./adminroutes/01_alladmin/admin-authorization/[id]";

// Create admin router
const adminRouter = express.Router();

// Authentication routes
adminRouter.post("/testing", createUsersFromEmployment);
adminRouter.post("/users/loginUserRISE", loginuserRISE);

// Events routes
adminRouter.get("/events", getAdminEvents);
adminRouter.post("/events", createEvent);
adminRouter.get("/events/:id", getEventById);
adminRouter.put("/events/:id", updateEvent);
adminRouter.delete("/events/:id", deleteEvent);

// Career areas routes
adminRouter.get("/admin-career-areas", getAdminCareerAreas);
adminRouter.post("/admin-career-areas", createCareerArea);
adminRouter.get("/admin-career-areas/:id", getCareerAreaById);
adminRouter.put("/admin-career-areas/:id", updateCareerArea);
adminRouter.delete("/admin-career-areas/:id", deleteCareerArea);

// Hexas routes
adminRouter.get("/admin-hexas", getAdminHexas);
adminRouter.post("/admin-hexas", createHexa);
adminRouter.get("/admin-hexas/:id", getHexaById);
adminRouter.put("/admin-hexas/:id", updateHexa);
adminRouter.delete("/admin-hexas/:id", deleteHexa);

// Benefits routes
adminRouter.get("/admin-benefits", getAdminBenefits);
adminRouter.post("/admin-benefits", createBenefit);
adminRouter.get("/admin-benefits/:id", getBenefitById);
adminRouter.put("/admin-benefits/:id", updateBenefit);
adminRouter.delete("/admin-benefits/:id", deleteBenefit);

// Stories routes
adminRouter.get("/admin-stories", getAdminStories);
adminRouter.post("/admin-stories", createStory);
adminRouter.get("/admin-stories/:id", getStoryById);
adminRouter.put("/admin-stories/:id", updateStory);
adminRouter.delete("/admin-stories/:id", deleteStory);
adminRouter.patch("/admin-stories/:id/content", patchContentSections);

// Video routes
adminRouter.get("/admin-video", getAdminVideo);
adminRouter.put("/admin-video", updateVideo);

// Banner routes
adminRouter.get("/admin-banners", getAdminBanners);
adminRouter.post("/admin-banners", createBanner);
adminRouter.get("/admin-banners/:id", getBannerById);
adminRouter.put("/admin-banners/:id", updateBanner);
adminRouter.delete("/admin-banners/:id", deleteBanner);

// Company routes
adminRouter.get("/admin-companies", getCompanies);
adminRouter.post("/admin-companies", createCompany);
adminRouter.get("/admin-companies/:id", getCompanyById);
adminRouter.put("/admin-companies/:id", updateCompany);
adminRouter.delete("/admin-companies/:id", deleteCompany);

// Department routes
adminRouter.get("/admin-departments", getDepartments);
adminRouter.post("/admin-departments", createDepartment);
adminRouter.get("/admin-departments/:id", getDepartmentById);
adminRouter.put("/admin-departments/:id", updateDepartment);
adminRouter.delete("/admin-departments/:id", deleteDepartment);
adminRouter.patch("/admin-departments/:id/deactivate", deactivateDepartment);

// Site routes
adminRouter.get("/admin-sites", getSites);
adminRouter.post("/admin-sites", createSite);
adminRouter.get("/admin-sites/:id", getSiteById);
adminRouter.put("/admin-sites/:id", updateSite);
adminRouter.delete("/admin-sites/:id", deleteSite);

// Level routes
adminRouter.get("/admin-levels", getLevels);
adminRouter.post("/admin-levels", createLevel);
adminRouter.get("/admin-levels/:id", getLevelById);
adminRouter.put("/admin-levels/:id", updateLevel);
adminRouter.delete("/admin-levels/:id", deleteLevel);
adminRouter.patch("/admin-levels/:id/deactivate", deactivateLevel);

// Candidate management routes
// adminRouter.get("/candidates-null-status", getNullStatusCandidates);
// adminRouter.post("/admin-candidate/bulk-status-update", updateBulkCandidateStatus);
// adminRouter.get("/admin-candidate/:id", getCandidateDetails);
// adminRouter.put("/admin-candidate/:id/status", updateStatus);

// // Admin Job Vacancies routes
// adminRouter.get("/admin-job-vacancies", getAdminJobVacancies);
// adminRouter.get("/admin-job-vacancies/:id/candidates", getAdminJobVacancyCandidates);

// // Candidate statistics and filtering routes
// adminRouter.get("/candidate-statistics", getCandidateStatistics);
// adminRouter.get("/candidates-filter", getCandidatesWithFilter);
// adminRouter.get("/candidate-detail/:id", getCandidateDetail);


adminRouter.get("/userRise", getAuthorizations);
adminRouter.post("/userRise", createAuthorization);
adminRouter.get("/userRise/:id", getAuthorizationById);
// adminRouter.put("/userRise/:id", updateAuthorization);
adminRouter.delete("/userRise/:id", deleteAuthorization);



export default adminRouter;