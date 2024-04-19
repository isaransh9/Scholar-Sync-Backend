import { Router } from "express";
import { uploadOpenings, getAllJobPost, getJobsOfSameCollege, getPreviousPost } from "../controllers/job.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/uploadOpenings').post(verifyJWT, uploadOpenings);
router.route('/getAllJobPost').post(verifyJWT, getAllJobPost);
router.route('/getJobsOfSameCollege').post(verifyJWT, getJobsOfSameCollege);
router.route('/getPreviousPost').post(verifyJWT, getPreviousPost);

export default router;