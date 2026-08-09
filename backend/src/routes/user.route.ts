import express from "express";
import {requireAdmin, requireAuth} from "../middlewares/auth.middleware";
import * as validate from "../validators/user.validator";
import * as controller from "../controllers/user.controller";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, validate.getUsers, controller.getUsers);
router.get("/:id", validate.getUserById, controller.getUserById);
router.patch("/:id/role", requireAuth, requireAdmin, validate.updateUserRole, controller.updateUserRole);

export default router;
