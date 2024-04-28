import { Router } from "express";
import { uploadOpenings, getAllJobPost, getJobsOfSameCollege, getPreviousPost, userAppliedOnJob } from "../controllers/job.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route('/uploadOpenings').post(verifyJWT,upload.fields([                   // Middleware
  {
    name: "detailsLink",
    minCount: 1
  }
]), uploadOpenings);
router.route('/getAllJobPost').post(verifyJWT, getAllJobPost);
router.route('/getJobsOfSameCollege').post(verifyJWT, getJobsOfSameCollege);
router.route('/getPreviousPost').post(verifyJWT, getPreviousPost);
router.route('/userAppliedOnJob/:jobId').post(verifyJWT, userAppliedOnJob);

export default router;