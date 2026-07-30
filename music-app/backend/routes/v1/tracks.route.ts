import express from "express";
import * as controller from "../../controllers/v1/tracks.controller.js"
import {requireAuth} from "../../middlewares/v1/auth.middleware.js";
import {uploadMultipleFiles, uploadToCloudinaryMultiple} from "../../middlewares/v1/upload.middleware.js";

import {createTrackValidate} from "../../validates/tracks.validate.js";

const router = express.Router();

router.post("/",
    requireAuth,
    uploadMultipleFiles.fields([
        {name: 'avatar', maxCount: 1},
        {name: 'audio', maxCount: 1},
        {name: 'lyrics', maxCount: 1}
    ]),
    createTrackValidate,
    uploadToCloudinaryMultiple,
    controller.tracksPost
);
router.get("/:trackId", controller.getTrackId);

export default router;