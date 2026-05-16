import { Router } from "express";
import { authCallback, getMe } from "../controllers/auth.controller";
import { protectRoute } from "../middleware/auth";

const router = Router();

// @route:  GET /api/auth/me
// @desc:   Get current logged in user
// @access: Protected
router.get("/me", protectRoute, getMe);

// @route:  POST /api/auth/callback
// @desc:   Handle authentication callback
// @access: Public
router.post("/callback", authCallback);

export default router;