import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getMessages } from "../controllers/message.controller";

const router = Router();

// @route: GET /api/message/chat/:chatId
// @desc: Get all messages for a specific chat
// @access: Protected
router.get("/chat/:chatId", protectRoute, getMessages);

export default router;