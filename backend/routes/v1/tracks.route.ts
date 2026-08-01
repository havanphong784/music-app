import express from "express";
import * as controller from "../../controllers/v1/tracks.controller.js"
import {requireAuth} from "../../middlewares/v1/auth.middleware.js";
import {uploadMultipleFiles, uploadToCloudinaryMultiple} from "../../middlewares/v1/upload.middleware.js";
import {createTrackValidate, patchTrackValidate} from "../../validates/tracks.validate.js";

const router = express.Router();
router.get("/", controller.tracksGet);
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
router.patch("/:trackId",
    requireAuth,
    uploadMultipleFiles.fields([
        {name: 'avatar', maxCount: 1},
        {name: 'audio', maxCount: 1},
        {name: 'lyrics', maxCount: 1}
    ]),
    patchTrackValidate,
    uploadToCloudinaryMultiple,
    controller.patchTrackId
);
router.delete("/:trackId", requireAuth, controller.deleteTrack);
router.get("/:trackId/stream", controller.getTrackStream);
router.post("/:trackId/plays", controller.postTrackPlay);
router.post("/:trackId/comment", requireAuth, controller.postTrackComment);
router.get("/:trackId/comment", controller.getTrackComment);

export default router;