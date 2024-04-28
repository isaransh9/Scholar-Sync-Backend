import { Router } from "express";
import { addCertificate, addEducation, addPosOfRes, addProject, addSkill, addWorkExperience, deleteCertificate, deleteEducation, deletePosOfRes, deleteProject, deleteSkill, deleteWorkExperience, getNotifications, getProfileDetail, uploadUserProfilePicture, viewProfile } from "../controllers/profile.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/uploadProfilePicture').post(verifyJWT, upload.fields([
  {
    name: "profilePicture",
    maxCount: 1
  }
]),
  uploadUserProfilePicture);

// Add data to profile
router.route('/addEducation').post(verifyJWT, addEducation);
router.route('/addCertificate').post(verifyJWT, addCertificate);
router.route('/addProject').post(verifyJWT, addProject);
router.route('/addPosOfRes').post(verifyJWT, addPosOfRes);
router.route('/addWorkExperience').post(verifyJWT, addWorkExperience);
router.route('/addSkill').post(verifyJWT, addSkill);

// Delete data from profile
router.route('/deleteEducation/:educationId').post(verifyJWT,deleteEducation);
router.route('/deleteCertificate/:certificateId').post(verifyJWT,deleteCertificate);
router.route('/deleteProject/:projectId').post(verifyJWT,deleteProject);
router.route('/deletePosOfRes/:posOfResId').post(verifyJWT,deletePosOfRes);
router.route('/deleteWorkExperience/:workExperienceId').post(verifyJWT,deleteWorkExperience);
router.route('/deleteSkill').post(verifyJWT,deleteSkill);

// View profile of user
router.route('/viewProfile/:userId').post(verifyJWT,viewProfile);
router.route('/getNotification').post(verifyJWT, getNotifications);
router.route('/getProfileDetail').post(verifyJWT,getProfileDetail);

export default router;