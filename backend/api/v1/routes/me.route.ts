import express from "express";
import {requireAuth} from "../middlewares/auth.middleware";
import * as validate from "../validates/user.validate";
import * as controller from "../controllers/user.controller";

const router = express.Router();

router.get("/", requireAuth, controller.getMe);
router.patch("/", requireAuth, validate.updateMe, controller.updateMe);

export default router;
