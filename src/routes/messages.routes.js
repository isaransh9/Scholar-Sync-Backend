import { Router } from "express";
import { getMessage, sendMessage, getOneUserConversation, getAllUserData } from "../controllers/messages.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/getMessage/:friendId').post(verifyJWT, getMessage);
router.route('/sendMessage/:id').post(verifyJWT, sendMessage);
router.route('/getOneUserConversation/:friendId').post(verifyJWT, getOneUserConversation);
router.route('/getAllUserData').post(verifyJWT, getAllUserData);

export default router;