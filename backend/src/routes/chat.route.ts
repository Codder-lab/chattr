import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getChats, getOrCreateChat } from "../controllers/chat.controller";

const router = Router();

// @route GET /api/chat/
// @desc Get all chats for current user
// @access Private
router.get("/", protectRoute, getChats);

// @route POST api/chat/with/:participantId
// @desc Get or create chat with another user
// @access Private
router.post("/with/:participantId", protectRoute, getOrCreateChat);

export default router;
