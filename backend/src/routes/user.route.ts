import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getUsers } from "../controllers/user.controller";

const router = Router();

// @route: GET /api/users
// @desc: Get all users
// @access: Protected
router.get("/", protectRoute, getUsers);

export default router;
