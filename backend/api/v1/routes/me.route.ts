import express from "express";
import {requireAuth} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/uploadCloud.middleware";
import * as validate from "../validates/user.validate";
import * as controller from "../controllers/user.controller";

const router = express.Router();

router.get("/", requireAuth, controller.getMe);
router.patch(
    "/",
    requireAuth,
    uploadSingle("avatar"),
    validate.updateMe,
    uploadToCloudinary,
    controller.updateMe
);

export default router;
