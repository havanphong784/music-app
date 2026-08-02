import express from 'express'
import {requireAuth} from "../../middlewares/v1/auth.middleware.js";
import * as controller from "../../controllers/v1/user.controller.js"
import {uploadMultipleFiles, uploadToCloudinaryMultiple} from "../../middlewares/v1/upload.middleware.js";
import * as validate from "../../validates/user.validate.js"

const router = express.Router();

router.get("/me", requireAuth, controller.getMe);
router.patch(
    "/me",
    requireAuth,
    uploadMultipleFiles.fields([{name: "avatar", maxCount: 1}]),
    validate.patchMe,
    uploadToCloudinaryMultiple,
    controller.patchMe
);


export default router;
